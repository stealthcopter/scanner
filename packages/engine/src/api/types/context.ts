import { type SDK } from "caido:plugin";
import { type Request, type Response } from "caido:utils";

import { type ParsedHtml } from "../../utils/html/types";

export enum ScanStrength {
  LOW,
  MEDIUM,
  HIGH,
}

export type RequestContext = {
  request: Request;
  response?: Response;
};

export type CheckContext = RequestContext & {
  sdk: SDK;
  dependencies: <T = unknown>(id: string) => T;
  htmlCache: Map<string, ParsedHtml>;
  strength: ScanStrength;
};
