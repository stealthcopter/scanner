import { RuntimeContext, ScanTarget } from "engine";

export type ParamSource = "query" | "body" | "header";
export type TestParam = {
  name: string;
  originalValue: string;
  source: ParamSource;
};

export function buildTestRequest(
  context: RuntimeContext,
  param: TestParam,
  value: string
) {
  const requestSpec = context.target.request.toSpec();

  if (param.source === "query") {
    const queryString = requestSpec.getQuery();
    const urlParams = new URLSearchParams(queryString);
    urlParams.set(param.name, value);
    requestSpec.setQuery(urlParams.toString());
  } else if (param.source === "body") {
    const body = requestSpec.getBody()?.toText();
    if (body) {
      const contentType = requestSpec
        .getHeader("Content-Type")?.[0]
        ?.toLowerCase();

      if (contentType?.includes("application/json")) {
        try {
          const bodyParams = JSON.parse(body) as Record<string, string>;
          bodyParams[param.name] = value;
          requestSpec.setBody(JSON.stringify(bodyParams));
        } catch (error) {
          // ignore
        }
      } else {
        const bodyParams = new URLSearchParams(body);
        bodyParams.set(param.name, value);
        requestSpec.setBody(bodyParams.toString());
      }
    }
  }

  return requestSpec;
}

export function extractParameters(context: RuntimeContext): TestParam[] {
  const params: TestParam[] = [];
  const { request } = context.target;

  const queryString = request.getQuery();
  if (queryString) {
    const urlParams = new URLSearchParams(queryString);
    for (const [name, value] of urlParams.entries()) {
      if (name && value) {
        params.push({
          name,
          originalValue: value,
          source: "query",
        });
      }
    }
  }

  if (request.getMethod().toUpperCase() === "POST" && request.getBody()) {
    const contentType = request.getHeader("Content-Type")?.[0]?.toLowerCase();
    if (contentType?.includes("application/x-www-form-urlencoded")) {
      const body = request.getBody()?.toText();
      if (body) {
        const bodyParams = new URLSearchParams(body);
        for (const [name, value] of bodyParams.entries()) {
          if (name && value) {
            params.push({
              name,
              originalValue: value,
              source: "body",
            });
          }
        }
      }
    }

    if (contentType?.includes("application/json")) {
      const body = request.getBody()?.toText();
      if (body) {
        try {
          const bodyParams = JSON.parse(body) as Record<string, string>;
          for (const [name, value] of Object.entries(bodyParams)) {
            if (name && value) {
              params.push({
                name,
                originalValue: value,
                source: "body",
              });
            }
          }
        } catch (error) {
          // ignore
        }
      }
    }
  }

  return params;
}

export function isTargetEligible(target: ScanTarget): boolean {
  const { request } = target;

  const queryString = request.getQuery();
  const hasParams = queryString && queryString.length > 0;
  const hasBody = request.getBody() !== undefined;

  return hasParams || hasBody;
}
