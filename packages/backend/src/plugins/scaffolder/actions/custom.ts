import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import axios from 'axios'
import * as https from 'https';

export const createArgoCDAction = () => {
  return createTemplateAction<{ contents: string; filename: string }>({
    id: 'kerberus:argocd',
    schema: {
      input: {
        required: ['host'],
        type: 'object',
        properties: {
          host: {
            type: 'string',
            title: 'Host',
            description: 'Host',
          }
        }
      }
    },
    async handler(ctx) {
      const axiosInstance = axios.create({
        httpsAgent: new https.Agent({  
          rejectUnauthorized: false
        })
      })

      const fullUrl = `https://${ctx.input.host.substring(1)}`
      const url = new URL(fullUrl)
      const owner = url.searchParams.get("owner")
      const repo = url.searchParams.get("repo")
      const base = url.origin

      ctx.logger.info(`Creating application on ArgoCD whit this params:`);
      ctx.logger.info(`- RepoUrl: ${base}/${owner}/${repo}.git`);
      ctx.logger.info(`- Namespace: ${repo}`);

      await axiosInstance.post(
        `http://argocd-server.argo-system.svc/api/v1/applications`,
        {
            "metadata": {
                "name": repo
            },
            "spec": {
                "source": {
                    "repoURL": `${base}/${owner}/${repo}.git`,
                    "path": "charts/"
                },
                "destination": {
                    "namespace": repo,
                    "server": "https://kubernetes.default.svc"
                },
                "syncPolicy": {
                    "syncOptions": [
                        "CreateNamespace=true"
                    ],
                    "automated": {
                        "allowEmpty": true,
                        "prune": false,
                        "selfHeal": false
                    }
                }
            }
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `${process.env.ARGOCD_AUTH_TOKEN}`
          }
        }
      )
      ctx.logger.info(`Application created successfully! 👍`);
    },
  });
};