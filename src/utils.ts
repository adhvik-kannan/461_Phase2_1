export function extractPackageName(url: string): string | null {
    const GITHUB_URL_PATTERN = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)/;
    const NPM_URL_PATTERN = /^https:\/\/www\.npmjs\.com\/package\/([^\/]+)/;

    try {
        const parsedUrl = new URL(url);

        if (GITHUB_URL_PATTERN.test(parsedUrl.toString())) {
            const match = GITHUB_URL_PATTERN.exec(parsedUrl.toString());
            return match ? match[2] : null; // Return the repository name
        } else if (NPM_URL_PATTERN.test(parsedUrl.toString())) {
            const match = NPM_URL_PATTERN.exec(parsedUrl.toString());
            return match ? match[1] : null; // Return the package name
        } else {
            console.error('Unsupported URL type.');
            return null;
        }
    } catch (error) {
        console.error('Invalid URL:', error);
        return null;
    }
}