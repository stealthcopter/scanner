import {
  continueWith,
  defineCheck,
  done,
  Severity,
} from "engine";
import { keyStrategy } from "../../utils/key";
import { bodyMatchesAny } from "../../utils/body";

const ROBOTS_TXT_PATHS = [
  "/robots.txt",
  "/robots.TXT",
  "/ROBOTS.TXT",
  "/Robots.txt",
];

const ROBOTS_TXT_PATTERNS = [
  /User-Agent:\s*\*/i,
  /Disallow:\s*/i,
  /Allow:\s*/i,
  /Sitemap:\s*/i,
  /Crawl-Delay:\s*/i,
];

export default defineCheck<{
  robotsPaths: string[];
}>(({ step }) => {
  step("setupScan", (_, context) => {
    const robotsPaths = ROBOTS_TXT_PATHS;

    return continueWith({
      nextStep: "testRobotsPath",
      state: { robotsPaths },
    });
  });

  step("testRobotsPath", async (state, context) => {
    if (state.robotsPaths.length === 0) {
      return done({
        state,
      });
    }

    const [currentPath, ...remainingPaths] = state.robotsPaths;
    if (currentPath === undefined) {
      return done({
        state,
      });
    }

    const request = context.target.request.toSpec();

    request.setPath(currentPath);
    request.setMethod("GET");

    const result = await context.sdk.requests.send(request);

    if (result.response.getCode() === 200) {
      // Check if it's a valid robots.txt file
      if (bodyMatchesAny(result.response, ROBOTS_TXT_PATTERNS)) {
        return done({
          findings: [
            {
              name: "Robots.txt File Exposed",
              description: `Robots.txt file is publicly accessible at \`${currentPath}\`. This file may reveal directory structure, hidden paths, and crawling policies that could be useful for reconnaissance.`,
              severity: Severity.INFO,
              correlation: {
                requestID: result.request.getId(),
                locations: [],
              },
            },
          ],
          state,
        });
      }
    }

    return continueWith({
      nextStep: "testRobotsPath",
      state: {
        ...state,
        robotsPaths: remainingPaths,
      },
    });
  });

  return {
    metadata: {
      id: "robots-txt",
      name: "Robots.txt File",
      description:
        "Detects publicly accessible robots.txt files that may reveal directory structure and crawling policies",
      type: "active",
      tags: ["information-disclosure"],
      severities: [Severity.INFO],
      aggressivity: {
        minRequests: 1,
        maxRequests: ROBOTS_TXT_PATHS.length,
      },
    },

    initState: () => ({ robotsPaths: [], basePath: "" }),
    dedupeKey: keyStrategy().withHost().withPort().build(),
  };
});
