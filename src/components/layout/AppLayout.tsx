import React from "react";
import { PageLayout } from "@/components/PageLayout";
type AppLayoutProps = {
  children: React.ReactNode;
  container?: boolean;
  className?: string;
  contentClassName?: string;
};
/**
 * Enterprise Application Shell
 * Synchronized with primary PageLayout to maintain Material3 constraints and RBAC.
 */
export function AppLayout({ children, container = false }: AppLayoutProps): JSX.Element {
  return (
    <PageLayout fullBleed={!container}>
      {children}
    </PageLayout>
  );
}