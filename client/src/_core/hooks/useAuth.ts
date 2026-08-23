import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useMemo } from "react";

export function useAuth() {
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: user => utils.auth.me.setData(undefined, user),
  });

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: user => utils.auth.me.setData(undefined, user),
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const requestPasswordResetMutation = trpc.auth.requestPasswordReset.useMutation();

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: user => utils.auth.me.setData(undefined, user),
  });

  const deleteAccountMutation = trpc.auth.deleteAccount.useMutation({
    onSuccess: () => utils.auth.me.setData(undefined, null),
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(
    () => ({
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    }),
    [
      meQuery.data,
      meQuery.error,
      meQuery.isLoading,
      logoutMutation.error,
      logoutMutation.isPending,
    ]
  );

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
    login: loginMutation.mutateAsync,
    loginPending: loginMutation.isPending,
    loginError: loginMutation.error,
    signup: signupMutation.mutateAsync,
    signupPending: signupMutation.isPending,
    signupError: signupMutation.error,
    requestPasswordReset: requestPasswordResetMutation.mutateAsync,
    requestPasswordResetPending: requestPasswordResetMutation.isPending,
    requestPasswordResetError: requestPasswordResetMutation.error,
    resetPassword: resetPasswordMutation.mutateAsync,
    resetPasswordPending: resetPasswordMutation.isPending,
    resetPasswordError: resetPasswordMutation.error,
    deleteAccount: deleteAccountMutation.mutateAsync,
    deleteAccountPending: deleteAccountMutation.isPending,
    deleteAccountError: deleteAccountMutation.error,
  };
}
