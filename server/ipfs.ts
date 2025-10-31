import CryptoJS from "crypto-js";

interface PinataUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

interface IPFSUploadResult {
  cid: string;
  hash: string;
  url: string;
}

class PinataService {
  private apiKey: string;
  private apiSecret: string;
  private jwt: string;
  private gatewayUrl = "https://gateway.pinata.cloud/ipfs/";
  private hasCredentials: boolean;

  constructor() {
    this.apiKey = process.env.PINATA_API_KEY || "";
    this.apiSecret = process.env.PINATA_API_SECRET || "";
    this.jwt = process.env.PINATA_JWT || "";
    
    const customGateway = process.env.PINATA_GATEWAY;
    if (customGateway) {
      this.gatewayUrl = customGateway.endsWith('/') ? customGateway : `${customGateway}/`;
    }
    
    this.hasCredentials = !!(this.jwt && this.apiKey && this.apiSecret);

    if (!this.hasCredentials) {
      console.warn(
        "[IPFS] Pinata credentials not configured. Using simulated IPFS storage.",
      );
    } else {
      console.log("[IPFS] Pinata service initialized successfully");
    }
  }

  private generateSimulatedCID(): string {
    const randomBytes = require("crypto").randomBytes(16).toString("hex");
    return `Qm${randomBytes}`;
  }

  async uploadFile(
    fileData: string,
    fileName: string,
    metadata?: Record<string, any>,
  ): Promise<IPFSUploadResult> {
    // If credentials are missing, use simulated storage
    if (!this.hasCredentials) {
      console.log("[IPFS] Using simulated storage for file:", fileName);
      const fileHash = CryptoJS.SHA256(fileData).toString();
      const cid = this.generateSimulatedCID();
      return {
        cid,
        hash: fileHash,
        url: `${this.gatewayUrl}${cid}`,
      };
    }
    try {
      // Calculate file hash for integrity verification
      const fileHash = CryptoJS.SHA256(fileData).toString();

      // Convert base64 to buffer if needed
      let buffer: Buffer;
      if (fileData.startsWith("data:")) {
        // Extract base64 data from data URL
        const base64Data = fileData.split(",")[1];
        buffer = Buffer.from(base64Data, "base64");
      } else {
        buffer = Buffer.from(fileData);
      }

      // Create form data
      const FormData = (await import("form-data")).default;
      const formData = new FormData();
      formData.append("file", buffer, fileName);

      // Add metadata if provided
      const pinataMetadata = {
        name: fileName,
        keyvalues: metadata || {},
      };
      formData.append("pinataMetadata", JSON.stringify(pinataMetadata));

      // Upload to Pinata
      const response = await fetch(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.jwt}`,
            ...formData.getHeaders(),
          },
          body: formData as any,
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Pinata upload failed: ${response.status} - ${errorText}`,
        );
      }

      const result: PinataUploadResponse = await response.json();

      return {
        cid: result.IpfsHash,
        hash: fileHash,
        url: `${this.gatewayUrl}${result.IpfsHash}`,
      };
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
      throw new Error(
        `Failed to upload file to IPFS: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async uploadJSON(data: any, fileName: string): Promise<IPFSUploadResult> {
    // If credentials are missing, use simulated storage
    if (!this.hasCredentials) {
      console.log("[IPFS] Using simulated storage for JSON:", fileName);
      const jsonString = JSON.stringify(data);
      const fileHash = CryptoJS.SHA256(jsonString).toString();
      const cid = this.generateSimulatedCID();
      return {
        cid,
        hash: fileHash,
        url: `${this.gatewayUrl}${cid}`,
      };
    }
    try {
      const jsonString = JSON.stringify(data);
      const fileHash = CryptoJS.SHA256(jsonString).toString();

      const response = await fetch(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.jwt}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pinataContent: data,
            pinataMetadata: {
              name: fileName,
            },
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Pinata JSON upload failed: ${response.status} - ${errorText}`,
        );
      }

      const result: PinataUploadResponse = await response.json();

      return {
        cid: result.IpfsHash,
        hash: fileHash,
        url: `${this.gatewayUrl}${result.IpfsHash}`,
      };
    } catch (error) {
      console.error("Error uploading JSON to IPFS:", error);
      throw new Error(
        `Failed to upload JSON to IPFS: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getFile(cid: string): Promise<string> {
    try {
      const response = await fetch(`${this.gatewayUrl}${cid}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch file from IPFS: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error("Error fetching from IPFS:", error);
      throw new Error(
        `Failed to fetch file from IPFS: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  getCIDUrl(cid: string): string {
    return `${this.gatewayUrl}${cid}`;
  }
}

export const ipfsService = new PinataService();
export type { IPFSUploadResult };
