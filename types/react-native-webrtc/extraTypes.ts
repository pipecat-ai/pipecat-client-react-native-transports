export interface RTCIceServer {
  /**
   * An array of URLs of the ICE servers (STUN or TURN).
   * Can be a single string or an array of strings.
   */
  urls: string | string[];

  /**
   * Optional username for TURN servers that require authentication.
   */
  username?: string;

  /**
   * Optional credential (password or token) for TURN servers.
   */
  credential?: string;

  /**
   * Optional credential type. Usually "password" or "oauth".
   */
  credentialType?: "password" | "oauth";
}
