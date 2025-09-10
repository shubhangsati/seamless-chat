'use client';

import { useRouter } from 'next/navigation';
import { memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createStoreUpdater } from 'zustand-utils';

import { enableNextAuth } from '@/const/auth';
import { useIsMobile } from '@/hooks/useIsMobile';
import { pluginService } from '@/services/plugin';
import { useAgentStore } from '@/store/agent';
import { useAiInfraStore } from '@/store/aiInfra';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';
import { useServerConfigStore } from '@/store/serverConfig';
import { serverConfigSelectors } from '@/store/serverConfig/selectors';
import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/selectors';

const StoreInitialization = memo(() => {
  // prefetch error ns to avoid don't show error content correctly
  useTranslation('error');

  const router = useRouter();
  const [isLogin, isSignedIn, useInitUserState] = useUserStore((s) => [
    authSelectors.isLogin(s),
    s.isSignedIn,
    s.useInitUserState,
  ]);

  const { serverConfig } = useServerConfigStore();

  const useInitSystemStatus = useGlobalStore((s) => s.useInitSystemStatus);

  const useInitAgentStore = useAgentStore((s) => s.useInitInboxAgentStore);
  const useInitAiProviderKeyVaults = useAiInfraStore((s) => s.useFetchAiProviderRuntimeState);

  // init the system preference
  useInitSystemStatus();

  // fetch server config
  const useFetchServerConfig = useServerConfigStore((s) => s.useInitServerConfig);
  useFetchServerConfig();

  // Update NextAuth status
  const useUserStoreUpdater = createStoreUpdater(useUserStore);
  const oAuthSSOProviders = useServerConfigStore(serverConfigSelectors.oAuthSSOProviders);
  useUserStoreUpdater('oAuthSSOProviders', oAuthSSOProviders);

  /**
   * The store function of `isLogin` will both consider the values of `enableAuth` and `isSignedIn`.
   * But during initialization, the value of `enableAuth` might be incorrect cause of the async fetch.
   * So we need to use `isSignedIn` only to determine whether request for the default agent config and user state.
   */
  const isDBInited = useGlobalStore(systemStatusSelectors.isDBInited);
  const isLoginOnInit = isDBInited && (enableNextAuth ? isSignedIn : isLogin);

  // init inbox agent and default agent config
  useInitAgentStore(isLoginOnInit, serverConfig.defaultAgent?.config);

  // init user provider key vaults
  useInitAiProviderKeyVaults(isLoginOnInit);

  // init user state
  useInitUserState(isLoginOnInit, serverConfig, {
    onSuccess: (state) => {
      if (state.isOnboard === false) {
        router.push('/onboard');
      }
    },
  });

  const useStoreUpdater = createStoreUpdater(useGlobalStore);

  const mobile = useIsMobile();

  useStoreUpdater('isMobile', mobile);
  useStoreUpdater('router', router);

  // Initialize default Facebook Meta MCP server plugin
  useEffect(() => {
    if (isDBInited) {
      const initializeDefaultPlugin = async () => {
        try {
          const installedPlugins = await pluginService.getInstalledPlugins();
          const pluginExists = installedPlugins.some(
            (p) => p.identifier === 'facebook-meta-mcp-server',
          );

          if (!pluginExists) {
            const defaultPlugin = {
              customParams: {
                apiMode: 'simple' as const,
                avatar: '🧠',
                description: 'Facebook Meta MCP server providing AI model capabilities and tools',
                enableSettings: false,
                manifestMode: 'url' as const,
                mcp: {
                  auth: {
                    type: 'none' as const,
                  },
                  type: 'http' as const,
                  url: 'https://facebook-meta-mcp-server.vercel.app/mcp',
                },
              },
              identifier: 'facebook-meta-mcp-server',
              settings: {},
              type: 'customPlugin' as const,
            };

            await pluginService.createCustomPlugin(defaultPlugin);
            console.log('Default Facebook Meta MCP server plugin installed');
          }
        } catch (error) {
          console.warn('Failed to initialize default Facebook Meta MCP server plugin:', error);
        }
      };

      initializeDefaultPlugin();
    }
  }, [isDBInited]);

  return null;
});

export default StoreInitialization;
