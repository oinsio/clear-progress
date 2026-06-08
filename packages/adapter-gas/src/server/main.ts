import { deleteFile } from "./actions/delete-file";
import { getFile } from "./actions/get-file";
import { init } from "./actions/init";
import { ping } from "./actions/ping";
import { pull } from "./actions/pull";
import { purge } from "./actions/purge";
import { push } from "./actions/push";
import { uploadFile } from "./actions/upload-file";
import { uploadFiles } from "./actions/upload-files";
import { verifyToken } from "./helpers/auth";
import {
  ACTIONS,
  AUTH_FAILURE_REASONS,
  ERROR_MESSAGES,
} from "./helpers/constants";
import { ERROR_CODES, jsonError, jsonUnauthorized } from "./helpers/response";

const AUTH_FAILURE_MESSAGES: Record<string, string> = {
  [AUTH_FAILURE_REASONS.NETWORK_ERROR]: ERROR_MESSAGES.AUTH_NETWORK_ERROR,
  [AUTH_FAILURE_REASONS.GAS_PERMISSION_ERROR]:
    ERROR_MESSAGES.AUTH_GAS_PERMISSION_ERROR,
  [AUTH_FAILURE_REASONS.INVALID_RESPONSE]: ERROR_MESSAGES.AUTH_INVALID_RESPONSE,
  [AUTH_FAILURE_REASONS.EMAIL_NOT_VERIFIED]:
    ERROR_MESSAGES.AUTH_EMAIL_NOT_VERIFIED,
  [AUTH_FAILURE_REASONS.WRONG_ACCOUNT]: ERROR_MESSAGES.AUTH_WRONG_ACCOUNT,
};

// GAS entry points — must be global functions
function doGet(
  e: GoogleAppsScript.Events.DoGet,
): GoogleAppsScript.Content.TextOutput {
  const action = e.parameter?.action;
  if (action === ACTIONS.PING) return ping();
  return jsonError(
    ERROR_CODES.INVALID_ACTION,
    `${ERROR_MESSAGES.UNKNOWN_ACTION}: ${action}`,
  );
}

function doPost(
  e: GoogleAppsScript.Events.DoPost,
): GoogleAppsScript.Content.TextOutput {
  let body: { action?: string; access_token?: unknown; [key: string]: unknown };

  try {
    body = JSON.parse(e.postData?.contents ?? "{}");
  } catch {
    return jsonError(ERROR_CODES.INVALID_PAYLOAD, ERROR_MESSAGES.INVALID_JSON);
  }

  const { action, access_token, ...payload } = body;

  if (!access_token || typeof access_token !== "string") {
    return jsonUnauthorized(ERROR_MESSAGES.TOKEN_REQUIRED);
  }

  const authResult = verifyToken(access_token);
  if (!authResult.ok) {
    const baseMessage = AUTH_FAILURE_MESSAGES[authResult.reason];
    const fullMessage = authResult.details
      ? `${baseMessage}: ${authResult.details}`
      : baseMessage;
    return jsonUnauthorized(fullMessage);
  }

  switch (action) {
    case ACTIONS.INIT:
      return init();
    case ACTIONS.PULL:
      return pull(payload as Parameters<typeof pull>[0]);
    case ACTIONS.PUSH:
      return push(payload as Parameters<typeof push>[0]);
    case ACTIONS.UPLOAD_FILE:
      return uploadFile(payload as Parameters<typeof uploadFile>[0]);
    case ACTIONS.UPLOAD_FILES:
      return uploadFiles(payload as Parameters<typeof uploadFiles>[0]);
    case ACTIONS.DELETE_FILE:
      return deleteFile(payload as Parameters<typeof deleteFile>[0]);
    case ACTIONS.GET_FILE:
      return getFile(payload as Parameters<typeof getFile>[0]);
    case ACTIONS.PURGE:
      return purge(payload as Parameters<typeof purge>[0]);
    default:
      return jsonError(
        ERROR_CODES.INVALID_ACTION,
        `${ERROR_MESSAGES.UNKNOWN_ACTION}: ${action}`,
      );
  }
}

// Expose GAS entry points to global scope (required when bundled with esbuild IIFE format)
(globalThis as Record<string, unknown>).doGet = doGet;
(globalThis as Record<string, unknown>).doPost = doPost;
