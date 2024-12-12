data "terraform_remote_state" "do" {
  backend = "s3"
  config = {
    bucket = "tf-remote-state"
    key    = "tf-msvcs-digitalocean.tfstate"
    region = "auto"
    endpoints = {
      s3 = "https://316c0ba9429f31c14edaf70a48220769.r2.cloudflarestorage.com"
    }
    skip_requesting_account_id  = true
    skip_region_validation      = true
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_s3_checksum            = true
  }
}

data "terraform_remote_state" "app_0" {
  backend = "s3"
  config = {
    bucket = "tf-remote-state"
    key    = "tf-jdna-sync.tfstate"
    region = "auto"
    endpoints = {
      s3 = "https://316c0ba9429f31c14edaf70a48220769.r2.cloudflarestorage.com"
    }
    skip_requesting_account_id  = true
    skip_region_validation      = true
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_s3_checksum            = true
  }
}


provider "kubernetes" {
  host = data.terraform_remote_state.do.outputs.do_kubernetes_cluster_kube_config.host
  #   token                  = data.terraform_remote_state.do.outputs.do_kubernetes_cluster_kube_config.token
  cluster_ca_certificate = base64decode(data.terraform_remote_state.do.outputs.do_kubernetes_cluster_kube_config.cluster_ca_certificate)

  exec {
    command     = "doctl"
    api_version = "client.authentication.k8s.io/v1beta1"
    args = [
      "kubernetes",
      "cluster",
      "kubeconfig",
      "exec-credential",
      "--version=v1beta1",
      "--context=default",
      trimprefix(split(".", data.terraform_remote_state.do.outputs.do_kubernetes_cluster_kube_config.host)[0], "https://")
    ]
  }
}

locals {
  property_file   = "${path.module}/../property.json"
  project_data    = jsondecode(file(local.property_file))
  banners         = keys(local.project_data)
  app_name        = var.app_name != null ? var.app_name : "jdna-sync"
  app_secret_name = "app-secret"
  app_env         = terraform.workspace == "main" ? "live" : "test"
}

resource "kubernetes_manifest" "argo_app" {
  for_each = local.project_data

  manifest = {
    apiVersion = "argoproj.io/v1alpha1"
    kind       = "Application"
    metadata = {
      labels = {
        app = "${local.app_name}-${each.key}-${local.app_env}"
        env = local.app_env
      }
      name      = "${local.app_name}-${each.key}-${local.app_env}"
      namespace = data.terraform_remote_state.app_0.outputs.namespace
    }
    spec = {
      destination = {
        name      = data.terraform_remote_state.app_0.outputs.argo_details.destination
        namespace = "${data.terraform_remote_state.app_0.outputs.argo_details.namespace}-${local.app_env}"
      }
      project = data.terraform_remote_state.app_0.outputs.argo_details.project_name
      sources = [
        {
          path           = "argo-app"
          repoURL        = data.terraform_remote_state.app_0.outputs.argo_details.repo_url
          targetRevision = terraform.workspace
          kustomize = {
            commonLabels = {
              app                                            = "${local.app_name}-${each.key}-${local.app_env}"
              env                                            = local.app_env
              banner                                         = each.key
              "tags.datadoghq.com/${local.app_name}.env"     = local.app_env
              "tags.datadoghq.com/${local.app_name}.service" = local.app_name
            }
            namespace = "${data.terraform_remote_state.app_0.outputs.argo_details.namespace}-${local.app_env}"
            images = [
              "${var.image_registry}/${local.app_name}:${var.image_tags[terraform.workspace]}"
            ]
            patches = [
              {
                patch = <<-EOT
                - op: replace
                  path: /metadata/name
                  value: ${local.app_name}-${each.key}-${local.app_env}

                EOT
                target = {
                  kind = "Service"
                  name = "app-svc"
                }
              },
              {
                patch = <<-EOT
                - op: replace
                  path: /spec/selector/app
                  value: ${local.app_name}-${each.key}-${local.app_env}

                EOT
                target = {
                  kind = "Service"
                  name = "app-svc"
                }
              },
              {
                patch = <<-EOT
                - op: replace
                  path: /metadata/name
                  value: ${local.app_name}-${each.key}-${local.app_env}

                EOT
                target = {
                  kind = "Deployment"
                  name = "app-deployment"
                }
              },
              {
                patch = <<-EOT
                - op: replace
                  path: /spec/selector/matchLabels/app
                  value: ${local.app_name}-${each.key}-${local.app_env}

                EOT
                target = {
                  kind = "Deployment"
                  name = "app-deployment"
                }
              },
              {
                patch = <<-EOT
                - op: replace
                  path: /spec/template/spec/containers/0/env/3/value
                  value: ${local.app_env == "live" ? "info" : "debug"}

                EOT
                target = {
                  kind = "Deployment"
                  name = "app-deployment"
                }
              },
              {
                patch = <<-EOT
                - op: replace
                  path: /spec/template/spec/containers/0/env/5/valueFrom/secretKeyRef/name
                  value: "${local.app_secret_name}-${each.key}-${local.app_env}"

                EOT
                target = {
                  kind = "Deployment"
                  name = "app-deployment"
                }
              },
              {
                patch = <<-EOT
                - op: replace
                  path: /spec/template/spec/containers/0/env/0
                  value:
                    name: APP_PORT
                    value: "3000"

                EOT
                target = {
                  kind = "Deployment"
                  name = "app-deployment"
                }
              },
              {
                patch = <<-EOT
                - op: add
                  path: /metadata/name
                  value: ${local.app_name}-${each.key}-${local.app_env}

                EOT
                target = {
                  kind = "Ingress"
                  name = "app-ingress"
                }
              },
              {
                patch = <<-EOT
                - op: add
                  path: /metadata/annotations/external-dns.alpha.kubernetes.io~1hostname
                  value: "${local.app_name}-${each.key}${local.app_env == "live" ? "" : ".test"}.jdna.io"

                EOT
                target = {
                  kind = "Ingress"
                  name = "app-ingress"
                }
              },
              {
                patch = <<-EOT
                - op: replace
                  path: /spec/rules/0/host
                  value: "${local.app_name}-${each.key}${local.app_env == "live" ? "" : ".test"}.jdna.io"

                EOT
                target = {
                  kind = "Ingress"
                  name = "app-ingress"
                }
              },
              {
                patch = <<-EOT
                - op: replace
                  path: /spec/tls/0/hosts/0
                  value: "${local.app_name}-${each.key}${local.app_env == "live" ? "" : ".test"}.jdna.io"

                EOT
                target = {
                  kind = "Ingress"
                  name = "app-ingress"
                }
              },
              {
                patch = <<-EOT
                - op: replace
                  path: /spec/tls/0/secretName
                  value: "${local.app_name}-${each.key}-${local.app_env}-tls"

                EOT
                target = {
                  kind = "Ingress"
                  name = "app-ingress"
                }
              },
              {
                patch = <<-EOT
                - op: replace
                  path: /spec/rules/0/http/paths/0/backend/service/name
                  value: ${local.app_name}-${each.key}-${local.app_env}

                EOT
                target = {
                  kind = "Ingress"
                  name = "app-ingress"
                }
              },
              {
                patch = <<-EOT
                - op: replace
                  path: /metadata/name
                  value: "${local.app_name}-${each.key}-${local.app_env}-stores-cronjob"

                EOT
                target = {
                  kind = "CronJob"
                  name = "stores-cronjob"
                }
              },
              {
                patch = <<-EOT
                - op: replace
                  path: /spec/jobTemplate/spec/template/spec/containers/0/env/5/value
                  value: ${each.key}

                EOT
                target = {
                  kind = "CronJob"
                  name = "stores-cronjob"
                }
              },
              {
                patch = <<-EOT
                - op: replace
                  path: /spec/jobTemplate/spec/template/spec/containers/0/env/6/value
                  value: ${each.value}

                EOT
                target = {
                  kind = "CronJob"
                  name = "stores-cronjob"
                }
              },
              {
                patch = <<-EOT
                - op: replace
                  path: /metadata/name
                  value: "${local.app_name}-${each.key}-${local.app_env}-terminals-cronjob"

                EOT
                target = {
                  kind = "CronJob"
                  name = "terminals-cronjob"
                }
              },
              {
                patch = <<-EOT
                - op: replace
                  path: /spec/jobTemplate/spec/template/spec/containers/0/env/5/value
                  value: ${each.key}

                EOT
                target = {
                  kind = "CronJob"
                  name = "terminals-cronjob"
                }
              },
              {
                patch = <<-EOT
                - op: replace
                  path: /spec/jobTemplate/spec/template/spec/containers/0/env/6/value
                  value: ${each.value}

                EOT
                target = {
                  kind = "CronJob"
                  name = "terminals-cronjob"
                }
              },
              {
                patch = <<-EOT
                - op: replace
                  path: /metadata/name
                  value: ${local.app_name}-${each.key}-${local.app_env}-common

                EOT
                target = {
                  kind = "ExternalSecret"
                  name = "app-secret-common"
                }
              },
              {
                patch = <<-EOT
                - op: replace
                  path: /spec/target/name
                  value: ${local.app_name}-${each.key}-${local.app_env}-common

                EOT
                target = {
                  kind = "ExternalSecret"
                  name = "app-secret-common"
                }
              },
              {
                patch = <<-EOT
                - op: replace
                  path: /spec/data/0/remoteRef/property
                  value: ${local.app_env == "live" ? "credential" : "credential-test"}

                EOT
                target = {
                  kind = "ExternalSecret"
                  name = "app-secret-common"
                }
              },
              {
                patch = <<-EOT
                - op: replace
                  path: /metadata/name
                  value: ${local.app_name}-${each.key}-${local.app_env}-banner

                EOT
                target = {
                  kind = "ExternalSecret"
                  name = "app-secret-banner"
                }
              },
              {
                patch = <<-EOT
                - op: replace
                  path: /spec/target/name
                  value: ${local.app_name}-${each.key}-${local.app_env}-banner

                EOT
                target = {
                  kind = "ExternalSecret"
                  name = "app-secret-banner"
                }
              },
              {
                patch = <<-EOT
                - op: replace
                  path: /spec/data/0/remoteRef/key
                  value: ${local.app_name}-${each.key}-${local.app_env}

                EOT
                target = {
                  kind = "ExternalSecret"
                  name = "app-secret-banner"
                }
              },
            ]
          }
        },
      ]
      syncPolicy = {
        automated = {
          prune    = true
          selfHeal = true
        }
        syncOptions = [
          "CreateNamespace=true",
          "PrunePropagationPolicy=foreground",
          "PruneLast=true",
          "RespectIgnoreDifferences=true",
        ]
      }
    }
  }
}
