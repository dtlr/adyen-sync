# resource "kubernetes_manifest" "applicationset_jmc_apps_adyen_sync_appset" {
#   manifest = {
#     "apiVersion" = "argoproj.io/v1alpha1"
#     "kind" = "ApplicationSet"
#     "metadata" = {
#       "name" = "adyen-sync-appset"
#       "namespace" = "jmc-apps"
#     }
#     "spec" = {
#       "generators" = [
#         {
#           "list" = {
#             "elements" = [
#               {
#                 "adyen_env_suffix" = "-test"
#                 "env" = "qa"
#               },
#               {
#                 "env" = "prod"
#                 "git_branch" = "main"
#               },
#             ]
#           }
#         },
#       ]
#       "goTemplate" = true
#       "goTemplateOptions" = [
#         "missingkey=error",
#       ]
#       "template" = {
#         "metadata" = {
#           "labels" = {
#             "app" = "adyen-sync"
#             "env" = "{{ .env }}"
#           }
#           "name" = "adyen-sync-{{ .env }}"
#         }
#         "spec" = {
#           "destination" = {
#             "name" = "aks-northcentralus-c9d54b825de9"
#             "namespace" = "adyen-sync-{{ .env }}"
#           }
#           "project" = "jmc"
#           "sources" = [
#             {
#               "kustomize" = {
#                 "commonLabels" = {
#                   "env" = "{{ .env }}"
#                   "tags.datadoghq.com/adyen-sync.env" = "{{ .env }}"
#                   "tags.datadoghq.com/adyen-sync.service" = "adyen-sync"
#                 }
#                 "namespace" = "adyen-sync-{{ .env }}"
#                 "patches" = [
#                   {
#                     "patch" = <<-EOT
#                     - op: replace
#                       path: /spec/template/spec/containers/0/image
#                       value: "ghcr.io/dtlr/adyen-sync:{{ dig "git_branch" "dev" . }}"

#                     EOT
#                     "target" = {
#                       "kind" = "Deployment"
#                       "name" = "adyen-sync"
#                     }
#                   },
#                   {
#                     "patch" = <<-EOT
#                     - op: replace
#                       path: /spec/data/0/remoteRef/property
#                       value: "credential{{ dig "adyen_env_suffix" "" . }}"

#                     EOT
#                     "target" = {
#                       "kind" = "ExternalSecret"
#                       "name" = "app-secret"
#                     }
#                   },
#                   {
#                     "patch" = <<-EOT
#                     - op: replace
#                       path: /spec/template/spec/containers/0/env/0
#                       value:
#                         name: APP_PORT
#                         value: "3000"

#                     EOT
#                     "target" = {
#                       "kind" = "Deployment"
#                       "name" = "adyen-sync"
#                     }
#                   },
#                   {
#                     "patch" = <<-EOT
#                     - op: add
#                       path: /metadata/annotations/external-dns.alpha.kubernetes.io~1hostname
#                       value: "adyen-sync{{ dig "adyen_env_suffix" "" . }}.jdna.io"

#                     EOT
#                     "target" = {
#                       "kind" = "Ingress"
#                       "name" = "adyen-sync"
#                     }
#                   },
#                   {
#                     "patch" = <<-EOT
#                     - op: replace
#                       path: /spec/rules/0/host
#                       value: "adyen-sync{{ dig "adyen_env_suffix" "" . }}.jdna.io"

#                     EOT
#                     "target" = {
#                       "kind" = "Ingress"
#                       "name" = "adyen-sync"
#                     }
#                   },
#                   {
#                     "patch" = <<-EOT
#                     - op: replace
#                       path: /spec/tls/0/hosts/0
#                       value: "adyen-sync{{ dig "adyen_env_suffix" "" . }}.jdna.io"

#                     EOT
#                     "target" = {
#                       "kind" = "Ingress"
#                       "name" = "adyen-sync"
#                     }
#                   },
#                   {
#                     "patch" = <<-EOT
#                     - op: replace
#                       path: /spec/tls/0/secretName
#                       value: "adyen-sync-tls"

#                     EOT
#                     "target" = {
#                       "kind" = "Ingress"
#                       "name" = "adyen-sync"
#                     }
#                   },
#                 ]
#               }
#               "path" = "apps/adyen-sync"
#               "repoURL" = "https://github.com/dtlr/argo-manifest-monorepo.git"
#               "targetRevision" = "HEAD"
#             },
#           ]
#           "syncPolicy" = {
#             "automated" = {
#               "prune" = true
#               "selfHeal" = true
#             }
#             "syncOptions" = [
#               "CreateNamespace=true",
#               "PrunePropagationPolicy=foreground",
#               "PruneLast=true",
#               "RespectIgnoreDifferences=true",
#             ]
#           }
#         }
#       }
#     }
#   }
# }
