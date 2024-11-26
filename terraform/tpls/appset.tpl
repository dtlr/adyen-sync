---
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: ${ name }-appset
  namespace: ${ namespace }
spec:
  goTemplate: true
  goTemplateOptions:
    - missingkey=error
  generators:
    - list:
        elements:
          - env: qa
            adyen_env_suffix: "-test"
          - env: prod
            git_branch: "main"
  template:
    metadata:
      name: "${ name }-{{ .env }}"
      labels:
        app: "${ name }"
        env: "{{ .env }}"
    spec:
      destination:
        namespace: "${ name }-{{ .env }}"
        name: "${ cluster_name }"
      project: "${ project_name }"
      sources:
        - repoURL: https://github.com/dtlr/${ name }.git
          path: argo
          targetRevision: HEAD
          kustomize:
            namespace: "${ name }-{{ .env }}"
            commonLabels:
              env: "{{ .env }}"
              tags.datadoghq.com/${ name }.env: "{{ .env }}"
              tags.datadoghq.com/${ name }.service: ${ name }
            patches:
              - target:
                  kind: Deployment
                  name: ${ name }
                patch: |
                  - op: replace
                    path: /spec/template/spec/containers/0/image
                    value: "ghcr.io/dtlr/${ name }:{{ dig "git_branch" "dev" . }}"
              - target:
                  kind: ExternalSecret
                  name: app-secret
                patch: |
                  - op: replace
                    path: /spec/data/0/remoteRef/property
                    value: "credential{{ dig "adyen_env_suffix" "" . }}"
              - target:
                  kind: Deployment
                  name: ${ name }
                patch: |
                  - op: replace
                    path: /spec/template/spec/containers/0/env/0
                    value:
                      name: APP_PORT
                      value: "3000"
              - target:
                  kind: Ingress
                  name: ${ name }
                patch: |
                  - op: add
                    path: /metadata/annotations/external-dns.alpha.kubernetes.io~1hostname
                    value: "adyen-sync{{ dig "adyen_env_suffix" "" . }}.jdna.io"
              - target:
                  kind: Ingress
                  name: ${ name }
                patch: |
                  - op: replace
                    path: /spec/rules/0/host
                    value: "adyen-sync{{ dig "adyen_env_suffix" "" . }}.jdna.io"
              - target:
                  kind: Ingress
                  name: ${ name }
                patch: |
                  - op: replace
                    path: /spec/tls/0/hosts/0
                    value: "adyen-sync{{ dig "adyen_env_suffix" "" . }}.jdna.io"
              - target:
                  kind: Ingress
                  name: ${ name }
                patch: |
                  - op: replace
                    path: /spec/tls/0/secretName
                    value: "${ name }-tls"
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
          - PrunePropagationPolicy=foreground
          - PruneLast=true
          - RespectIgnoreDifferences=true
