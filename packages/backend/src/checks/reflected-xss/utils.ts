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

export function extractReflectedParameters(
  context: RuntimeContext
): TestParam[] {
  let params: TestParam[] = [];

  const { request, response } = context.target;

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

  if (response) {
    const body = response.getBody()?.toText();

    if (body) {
      params = params.filter((param) => {
        return body.includes(param.originalValue);
      });
    }
  }

  return params;
}

export function isExploitable(target: ScanTarget): boolean {
  const { request, response } = target;

  if (!response) {
    return false;
  }

  const contentType = response.getHeader("Content-Type")?.[0]?.toLowerCase();
  if (contentType && !contentType.includes("text/html")) {
    return false;
  }

  const method = request.getMethod().toUpperCase();
  if (!["GET", "POST"].includes(method)) {
    return false;
  }

  const responseBody = response.getBody()?.toText();
  if (!responseBody || responseBody.length === 0) {
    return false;
  }

  return true;
}
