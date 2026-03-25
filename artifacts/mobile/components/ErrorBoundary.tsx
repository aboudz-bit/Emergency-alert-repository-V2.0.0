import React, { Component, ComponentType, PropsWithChildren } from "react";

import { ErrorFallback, ErrorFallbackProps } from "@/components/ErrorFallback";
import { getHasHydrated } from "@/store";

export type ErrorBoundaryProps = PropsWithChildren<{
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, stackTrace: string) => void;
  /** Optional screen/route name for diagnostic logging */
  screenName?: string;
}>;

type ErrorBoundaryState = { error: Error | null };

/**
 * This is a special case for for using the class components. Error boundaries must be class components because React only provides error boundary functionality through lifecycle methods (componentDidCatch and getDerivedStateFromError) which are not available in functional components.
 * https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static defaultProps: {
    FallbackComponent: ComponentType<ErrorFallbackProps>;
  } = {
    FallbackComponent: ErrorFallback,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    const screenName = this.props.screenName || 'unknown';
    const hydrated = getHasHydrated();

    // Enhanced diagnostic logging for crash debugging
    console.error('══════════════════════════════════════════════════');
    console.error(`[ErrorBoundary] CRASH on screen: ${screenName}`);
    console.error(`[ErrorBoundary] Hydration complete: ${hydrated}`);
    console.error(`[ErrorBoundary] Error: ${error.message}`);
    console.error(`[ErrorBoundary] Stack: ${error.stack}`);
    console.error(`[ErrorBoundary] Component stack: ${info.componentStack}`);

    // Try to capture alert system state snapshot for diagnostics
    try {
      const { selectAlertSystemState } = require('@/store/selectors');
      const { useStore } = require('@/store');
      const state = useStore.getState();
      const alertState = selectAlertSystemState(state);
      console.error('[ErrorBoundary] AlertSystemState snapshot:', JSON.stringify({
        emergencyMode: alertState.emergencyMode,
        hasActiveAlert: !!alertState.activeAlert,
        activeZoneCount: alertState.activeZoneIds.length,
        bannerCount: alertState.banners.length,
        lastUpdatedAt: alertState.lastUpdatedAt,
      }));
      console.error('[ErrorBoundary] Store health:', JSON.stringify({
        hasAlerts: Array.isArray(state.alerts),
        hasZones: Array.isArray(state.zones),
        hasUsers: Array.isArray(state.users),
        hasEmergencyModes: !!state.emergencyModes,
        alertCount: state.alerts?.length ?? 'N/A',
        zoneCount: state.zones?.length ?? 'N/A',
        userCount: state.users?.length ?? 'N/A',
      }));
    } catch (diagError) {
      console.error('[ErrorBoundary] Failed to capture state snapshot:', diagError);
    }
    console.error('══════════════════════════════════════════════════');

    if (typeof this.props.onError === "function") {
      this.props.onError(error, info.componentStack);
    }
  }

  resetError = (): void => {
    this.setState({ error: null });
  };

  render() {
    const { FallbackComponent } = this.props;

    return this.state.error && FallbackComponent ? (
      <FallbackComponent
        error={this.state.error}
        resetError={this.resetError}
      />
    ) : (
      this.props.children
    );
  }
}
