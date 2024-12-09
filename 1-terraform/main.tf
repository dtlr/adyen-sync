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
  app_name = var.app_name != null ? var.app_name : "jdna-sync"
}

resource "kubernetes_manifest" "argo_app" {
  manifest = {
    apiVersion = "argoproj.io/v1alpha1"
    kind       = "Application"
    metadata = {
      labels = {
        app = "${local.app_name}-${terraform.workspace == "main" ? "live" : "test"}"
        env = terraform.workspace == "main" ? "live" : "test"
      }
      name      = "${local.app_name}-${terraform.workspace == "main" ? "live" : "test"}"
      namespace = data.terraform_remote_state.app_0.outputs.namespace
    }
    spec = {
      destination = {
        name      = data.terraform_remote_state.app_0.outputs.argo_details.destination
        namespace = "${data.terraform_remote_state.app_0.outputs.argo_details.namespace}-${terraform.workspace == "main" ? "live" : "test"}"
      }
      project = data.terraform_remote_state.app_0.outputs.argo_details.project_name
      sources = [
        {
          kustomize = {
            commonLabels = {
              env                                            = terraform.workspace == "main" ? "live" : "test"
              "tags.datadoghq.com/${local.app_name}.env"     = terraform.workspace == "main" ? "live" : "test"
              "tags.datadoghq.com/${local.app_name}.service" = local.app_name
            }
            namespace = data.terraform_remote_state.app_0.outputs.argo_details.namespace
            images = [
              "${var.image_registry}/${local.app_name}:${var.image_tags[terraform.workspace]}"
            ]
            patches = [
              {
                patch = <<-EOT
                - op: replace
                  path: /metadata/name
                  value: ${local.app_name}
                
                EOT
                target = {
                  kind = "Service"
                  name = "svc"
                }
              },
              {
                patch = <<-EOT
                - op: replace
                  path: /spec/selector/app
                  value: ${local.app_name}
                
                EOT
                target = {
                  kind = "Service"
                  name = "svc"
                }
              },
              {
                patch = <<-EOT
                - op: add
                  path: /spec/data
                  value: |
                    - secretKey: DTLR_DATABASE_URI
                      remoteRef:
                        key: ${terraform.workspace == "main" ? "${local.app_name}-dtlr-live" : "${local.app_name}-dtlr-test"}
                        property: connection_string
                    - secretKey: SPC_DATABASE_URI
                      remoteRef:
                        key: ${terraform.workspace == "main" ? "${local.app_name}-spc-live" : "${local.app_name}-spc-test"}
                        property: connection_string
                
                EOT
                target = {
                  kind = "ExternalSecret"
                  name = "app-secret"
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
                  name = local.app_name
                }
              },
              {
                patch = <<-EOT
                - op: add
                  path: /metadata/annotations/external-dns.alpha.kubernetes.io~1hostname
                  value: "${local.app_name}${terraform.workspace == "main" ? "" : "-test"}.jdna.io"
                
                EOT
                target = {
                  kind = "Ingress"
                  name = local.app_name
                }
              },
              {
                patch = <<-EOT
                - op: replace
                  path: /spec/rules/0/host
                  value: "${local.app_name}${terraform.workspace == "main" ? "" : "-test"}.jdna.io"
                
                EOT
                target = {
                  kind = "Ingress"
                  name = local.app_name
                }
              },
              {
                patch = <<-EOT
                - op: replace
                  path: /spec/tls/0/hosts/0
                  value: "${local.app_name}${terraform.workspace == "main" ? "" : "-test"}.jdna.io"
                
                EOT
                target = {
                  kind = "Ingress"
                  name = local.app_name
                }
              },
              {
                patch = <<-EOT
                - op: replace
                  path: /spec/tls/0/secretName
                  value: "${local.app_name}-tls"
                
                EOT
                target = {
                  kind = "Ingress"
                  name = local.app_name
                }
              },
            ]
          }
          path           = "argo"
          repoURL        = data.terraform_remote_state.app_0.outputs.argo_details.repo_url
          targetRevision = "HEAD"
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


# resource "local_file" "appset" {
#   filename = "${path.module}/tfgen_appset.yml"
#   content = templatefile("${path.module}/tpls/appset.tpl", {
#     name           = "adyen-sync"
#     namespace      = local.app_namespace
#     project_name   = "adyen-sync"
#     cluster_name   = nonsensitive(data.terraform_remote_state.azure_0.outputs.aks_details.name)
#     image_tags     = var.image_tags
#     image_name     = var.image_name
#     image_registry = var.image_registry
#   })
# }
