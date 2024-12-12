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
  app_name        = var.app_name != null ? var.app_name : "jdna-sync"
  app_secret_name = "app-secret"
  banners         = keys(jsondecode(file("${path.module}/../property.json")))

  appset = yamldecode(templatefile("${path.module}/argo/appset.tftpl", {
    app_name          = local.app_name
    env               = terraform.workspace == "main" ? "live" : "test"
    dest_cluster_name = data.terraform_remote_state.app_0.outputs.argo_details.destination
    dest_cluster_ns   = data.terraform_remote_state.app_0.outputs.namespace
    project_name      = local.app_name
    list_elements     = yamlencode([for banner in local.banners : { banner = banner }])
    repo_url          = data.terraform_remote_state.app_0.outputs.argo_details.repo_url
    target_revision   = terraform.workspace
    image_registry    = var.image_registry
    image_name        = local.app_name
    image_tag         = var.image_tags[terraform.workspace]
    app_secret_name   = "${local.app_secret_name}-${terraform.workspace == "main" ? "live" : "test"}"
  }))

  appset_json = jsonencode(local.appset)
}

resource "local_file" "argo_appset" {
  content  = local.appset_json
  filename = "${path.module}/argo/appset.yaml"
}

# resource "kubernetes_manifest" "argo_appset" {
#   manifest = provider::kubernetes::manifest_decode(local.appset_json)
# }
