import { type RuntimeContext, type ScanTarget } from "engine";

export type ParameterSource = "query" | "body" | "header";

export type Parameter = {
  name: string;
  value: string;
  source: ParameterSource;
};

export function createRequestWithParameter(
  context: RuntimeContext,
  parameter: Parameter,
  newValue: string,
) {
  const requestSpec = context.target.request.toSpec();

  if (parameter.source === "query") {
    const queryString = requestSpec.getQuery();
    const urlParams = new URLSearchParams(queryString);
    urlParams.set(parameter.name, newValue);
    requestSpec.setQuery(urlParams.toString());
  } else if (parameter.source === "body") {
    const body = requestSpec.getBody()?.toText();
    if (body !== undefined) {
      const contentType = requestSpec
        .getHeader("Content-Type")?.[0]
        ?.toLowerCase();

      if (
        contentType !== undefined &&
        contentType.includes("application/json")
      ) {
        try {
          const bodyParams = JSON.parse(body) as Record<string, string>;
          bodyParams[parameter.name] = newValue;
          requestSpec.setBody(JSON.stringify(bodyParams));
        } catch (error) {
          // ignore
        }
      } else {
        const bodyParams = new URLSearchParams(body);
        bodyParams.set(parameter.name, newValue);
        requestSpec.setBody(bodyParams.toString());
      }
    }
  } else if (parameter.source === "header") {
    requestSpec.setHeader(parameter.name, newValue);
  }

  return requestSpec;
}

export function extractParameters(context: RuntimeContext): Parameter[] {
  const parameters: Parameter[] = [];
  const { request } = context.target;

  const queryString = request.getQuery();
  if (queryString !== undefined && queryString !== "") {
    const urlParams = new URLSearchParams(queryString);
    for (const [name, value] of urlParams.entries()) {
      if (name && value) {
        parameters.push({
          name,
          value,
          source: "query",
        });
      }
    }
  }

  if (
    request.getMethod().toUpperCase() === "POST" &&
    request.getBody() !== undefined
  ) {
    const contentType = request.getHeader("Content-Type")?.[0]?.toLowerCase();
    if (
      contentType !== undefined &&
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      const body = request.getBody()?.toText();
      if (body !== undefined) {
        const bodyParams = new URLSearchParams(body);
        for (const [name, value] of bodyParams.entries()) {
          if (name && value) {
            parameters.push({
              name,
              value,
              source: "body",
            });
          }
        }
      }
    }

    if (contentType !== undefined && contentType.includes("application/json")) {
      const body = request.getBody()?.toText();
      if (body !== undefined) {
        try {
          const bodyParams = JSON.parse(body) as Record<string, string>;
          for (const [name, value] of Object.entries(bodyParams)) {
            if (name && value) {
              parameters.push({
                name,
                value,
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

  return parameters;
}

export function extractReflectedParameters(
  context: RuntimeContext,
): Parameter[] {
  let parameters = extractParameters(context);
  const { response } = context.target;

  if (response !== undefined) {
    const body = response.getBody()?.toText();

    if (body !== undefined) {
      parameters = parameters.filter((parameter) => {
        return body.includes(parameter.value);
      });
    }
  }

  return parameters;
}

export function hasParameters(target: ScanTarget): boolean {
  const { request } = target;

  const queryString = request.getQuery();
  const hasQueryParams = queryString !== undefined && queryString.length > 0;
  const hasBody = request.getBody() !== undefined;

  return hasQueryParams || hasBody;
}
