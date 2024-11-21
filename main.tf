terraform {
  backend "s3" {
    bucket = "tf-remote-state"
    key    = "jmm-adyen-sync.tfstate"
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

  required_providers {

    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "4.46.0"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
    http = {
      source  = "hashicorp/http"
      version = ">=3.4.5"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">=2.33.0"
    }
    local = {
      source  = "hashicorp/local"
      version = ">=2.5.2"
    }
    onepassword = {
      source  = "1Password/onepassword"
      version = "~> 2.1.2"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6.3"
    }
    time = {
      source  = "hashicorp/time"
      version = ">=0.12.1"
    }
    tls = {
      source  = "hashicorp/tls"
      version = ">= 4.0.6"
    }

  }
}

provider "github" {
  owner = "dtlr"
  app_auth {}
}

data "http" "adyen_sync" {
  url = "https://github.com/dtlr/jmc-dtlr/pkgs/container/adyen-sync"
}
