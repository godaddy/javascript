import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useGoDaddyContext } from '@/godaddy-provider';

export type EntityType = 'STORE' | 'CUSTOMER';

export interface EnabledExtension {
  applicationId: string;
  releaseId: string;
  target: string;
}

export interface TargetProps {
  id: string;
  entityId: string;
  entityType: EntityType;
  style?: ViewStyle;
  webViewHeight?: number;
}

interface EnabledExtensionsResponse {
  data: {
    enabledExtensions: EnabledExtension[];
  };
}

function normalizeApiHost(host: string): string {
  return host.startsWith('http') ? host : `https://${host}`;
}

async function fetchEnabledExtensions(
  target: string,
  entityId: string,
  entityType: EntityType,
  apiHost: string,
  accessToken?: string
): Promise<EnabledExtension[]> {
  const baseUrl = normalizeApiHost(apiHost);
  const endpoint = `${baseUrl}/v1/apps/app-registry-subgraph`;

  const query = `
    query EnabledExtensions($entityId: String!, $entityType: EntityType!, $target: String!) {
      enabledExtensions(entityId: $entityId, entityType: $entityType, target: $target) {
        applicationId
        releaseId
        target
      }
    }
  `;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables: {
        entityId,
        entityType,
        target,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch extensions: ${response.statusText}`);
  }

  const result: EnabledExtensionsResponse = await response.json();
  return result.data.enabledExtensions ?? [];
}

function buildExtensionUrl(
  applicationId: string,
  releaseId: string,
  apiHost: string
): string {
  return `https://cdn.ui-extensions.commerce.${apiHost}/${applicationId}/${releaseId}/index.html`;
}

function TargetError() {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>Failed to load extension</Text>
    </View>
  );
}

function TargetLoading() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" />
    </View>
  );
}

interface ExtensionWebViewProps {
  extension: EnabledExtension;
  apiHost: string;
  height: number;
}

function ExtensionWebView({ extension, apiHost, height }: ExtensionWebViewProps) {
  const src = buildExtensionUrl(
    extension.applicationId,
    extension.releaseId,
    apiHost
  );

  return (
    <WebView
      source={{ uri: src }}
      style={[styles.webView, { height }]}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      startInLoadingState
      renderLoading={() => <TargetLoading />}
    />
  );
}

type FetchState =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'success'; data: EnabledExtension[] };

export function Target({
  id,
  entityId,
  entityType,
  style,
  webViewHeight = 200,
}: TargetProps) {
  const { apiHost, accessToken } = useGoDaddyContext();
  const [state, setState] = React.useState<FetchState>({ status: 'loading' });

  const resolvedApiHost = apiHost || 'api.godaddy.com';

  React.useEffect(() => {
    let cancelled = false;

    setState({ status: 'loading' });

    fetchEnabledExtensions(id, entityId, entityType, resolvedApiHost, accessToken)
      .then(data => {
        if (!cancelled) {
          setState({ status: 'success', data });
        }
      })
      .catch(error => {
        if (!cancelled) {
          setState({ status: 'error', error });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, entityId, entityType, resolvedApiHost, accessToken]);

  if (state.status === 'loading') {
    return <TargetLoading />;
  }

  if (state.status === 'error') {
    return <TargetError />;
  }

  if (state.data.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {state.data.map(extension => (
        <ExtensionWebView
          key={`${extension.applicationId}-${extension.releaseId}`}
          extension={extension}
          apiHost={resolvedApiHost}
          height={webViewHeight}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  loadingContainer: {
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  webView: {
    width: '100%',
  },
});
