import { type RuntimeContext, type ScanTarget } from "engine";

export type ParameterSource = "query" | "body" | "header";

export type Parameter = {
  name: string;
  value: string;
  source: ParameterSource;
};

type ContentType = "json" | "form" | "other";

function getContentType(headers: Record<string, Array<string>>): ContentType {
  const contentTypeHeaders = headers["Content-Type"] ?? headers["content-type"];
  const contentType = contentTypeHeaders?.[0]?.toLowerCase();

  if (contentType === undefined) {
    return "other";
  }

  if (contentType.includes("application/json")) {
    return "json";
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return "form";
  }

  return "other";
}

function parseJsonBody(body: string): Record<string, string> | undefined {
  try {
    return JSON.parse(body) as Record<string, string>;
  } catch {
    return undefined;
  }
}

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
    if (body === undefined) {
      return requestSpec;
    }

    const contentType = getContentType(requestSpec.getHeaders());

    if (contentType === "json") {
      const bodyParams = parseJsonBody(body);
      if (bodyParams !== undefined) {
        bodyParams[parameter.name] = newValue;
        requestSpec.setBody(JSON.stringify(bodyParams));
      }
    } else {
      const bodyParams = new URLSearchParams(body);
      bodyParams.set(parameter.name, newValue);
      requestSpec.setBody(bodyParams.toString());
    }
  } else if (parameter.source === "header") {
    requestSpec.setHeader(parameter.name, newValue);
  }

  return requestSpec;
}

function extractQueryParameters(queryString: string): Parameter[] {
  const parameters: Parameter[] = [];
  const urlParams = new URLSearchParams(queryString);

  for (const [name, value] of urlParams.entries()) {
    if (name && value) {
      parameters.push({ name, value, source: "query" });
    }
  }

  return parameters;
}

function extractBodyParameters(
  body: string,
  contentType: ContentType,
): Parameter[] {
  const parameters: Parameter[] = [];

  if (contentType === "form") {
    const bodyParams = new URLSearchParams(body);
    for (const [name, value] of bodyParams.entries()) {
      if (name && value) {
        parameters.push({ name, value, source: "body" });
      }
    }
  } else if (contentType === "json") {
    const bodyParams = parseJsonBody(body);
    if (bodyParams !== undefined) {
      for (const [name, value] of Object.entries(bodyParams)) {
        if (name && value) {
          parameters.push({ name, value, source: "body" });
        }
      }
    }
  }

  return parameters;
}

export function extractParameters(context: RuntimeContext): Parameter[] {
  const parameters: Parameter[] = [];
  const { request } = context.target;

  const queryString = request.getQuery();
  if (queryString !== undefined && queryString !== "") {
    parameters.push(...extractQueryParameters(queryString));
  }

  const requestBody = request.getBody();
  if (
    request.getMethod().toUpperCase() !== "GET" &&
    requestBody !== undefined
  ) {
    const body = requestBody.toText();
    if (body !== undefined) {
      const contentType = getContentType(request.getHeaders());
      parameters.push(...extractBodyParameters(body, contentType));
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
