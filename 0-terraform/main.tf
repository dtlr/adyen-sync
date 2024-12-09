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

data "terraform_remote_state" "azure_0" {
  backend = "s3"
  config = {
    bucket = "tf-remote-state"
    key    = "tf-msvcs-azure-0.tfstate"
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

data "onepassword_item" "gh_app" {
  vault = "aqv3bz4wn3q755cmyjgpfrc7ja"
  uuid  = "zpfzsvur3faith3dt6g5fh4jo4"
}


data "kubernetes_all_namespaces" "allns" {
}

locals {
  app_namespace = var.namespace != null ? var.namespace : var.image_name
  gh_domain     = replace(var.image_registry, "ghcr.io", "github.com")
}

resource "kubernetes_namespace" "ns" {
  metadata {
    name = local.app_namespace
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "kubernetes_manifest" "argo_prj" {
  manifest = {
    apiVersion = "argoproj.io/v1alpha1"
    kind       = "AppProject"
    metadata = {
      name      = var.image_name
      namespace = "argocd"
    }
    spec = {
      description = var.image_name
      sourceNamespaces = [
        local.app_namespace,
      ]
      sourceRepos = [
        "https://${local.gh_domain}/${var.image_name}.git"
      ]
      clusterResourceWhitelist = [
        {
          group = "*"
          kind  = "*"
        }
      ]
      namespaceResourceWhitelist = [
        {
          group = "*"
          kind  = "*"
        }
      ]
      destinations = [
        {
          name      = nonsensitive(data.terraform_remote_state.azure_0.outputs.aks_details.name)
          namespace = "*"
          server    = "*"
        }
      ]
      orphanedResources = {
        warn = true
      }
    }
  }
}

resource "kubernetes_secret" "repo" {
  metadata {
    name      = "${var.image_name}-repo"
    namespace = local.app_namespace
    labels = {
      "argocd.argoproj.io/secret-type" = "repository"
    }
  }
  data = {
    type                    = "git"
    url                     = "https://${local.gh_domain}/${var.image_name}.git"
    githubAppID             = data.onepassword_item.gh_app.section.0.field.1.value
    githubAppInstallationID = data.onepassword_item.gh_app.section.0.field.2.value
    githubAppPrivateKey     = <<-PRVKEY
    ${data.onepassword_item.gh_app.private_key}
    PRVKEY
  }
}

output "namespace" {
  value = local.app_namespace
}

output "argo_details" {
  value = {
    project_name = kubernetes_manifest.argo_prj.manifest.metadata.name
    destination  = nonsensitive(data.terraform_remote_state.azure_0.outputs.aks_details.name)
    namespace    = local.app_namespace
    repo_url     = "https://${local.gh_domain}/${var.image_name}.git"
  }
}
