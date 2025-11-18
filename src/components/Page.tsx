'use client';

import { backButton, miniApp } from '@telegram-apps/sdk-react';
import { PropsWithChildren, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function Page({ children, back = true }: PropsWithChildren<{
  /**
   * True if it is allowed to go back from this page.
   * @default true
   */
  back?: boolean
}>) {
  const router = useRouter();

  useEffect(() => {
    backButton.show();

    return () => {
      backButton.hide();
    };
  }, []);

  useEffect(() => {
    return backButton.onClick(() => {
      if (back) {
        router.back();
        return;
      }

      miniApp.close.ifAvailable?.();
    });
  }, [back, router]);

  return <>{children}</>;
}