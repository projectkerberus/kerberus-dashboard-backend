import {
  DockerContainerRunner,
  SingleHostDiscovery,
} from '@backstage/backend-common';
import { CatalogClient } from '@backstage/catalog-client';
import {
  createRouter,
  createBuiltinActions,
} from '@backstage/plugin-scaffolder-backend';
import Docker from 'dockerode';
import { Router } from 'express';
import type { PluginEnvironment } from '../types';
import { ScmIntegrations } from '@backstage/integration';
import {
  createArgoCDAction,
  createSonarCloudAction,
} from './scaffolder/actions';

export default async function createPlugin({
  logger,
  config,
  database,
  reader,
}: PluginEnvironment): Promise<Router> {
  const dockerClient = new Docker();
  const containerRunner = new DockerContainerRunner({ dockerClient });

  const discovery = SingleHostDiscovery.fromConfig(config);
  const catalogClient = new CatalogClient({ discoveryApi: discovery });

  const integrations = ScmIntegrations.fromConfig(config);

  const builtInActions = createBuiltinActions({
    containerRunner,
    integrations,
    config,
    catalogClient,
    reader,
  });

  const actions = [
    ...builtInActions,
    createArgoCDAction(),
    createSonarCloudAction(),
  ];

  return await createRouter({
    containerRunner,
    logger,
    config,
    database,
    catalogClient,
    reader,
    actions,
  });
}
