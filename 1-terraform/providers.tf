terraform {
  backend "s3" {
    bucket = "tf-remote-state"
    key    = "tf-jdna-sync-1.tfstate"
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
  }
}

variable "image_registry" {
  type    = string
  default = "ghcr.io/dtlr"
}

variable "image_tags" {
  type = map(string)
  default = {
    main = "latest"
    qa   = "qa"
  }
}

variable "app_name" {
  type    = string
  default = null
}
