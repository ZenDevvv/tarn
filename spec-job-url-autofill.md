# Specification: Job Posting URL Auto-Fill & Metadata Extraction

## 1. Overview & Problem Statement
Currently, saving a job requires manual entry of the company name, position title, work setup, compensation, and location. Users frequently bookmark jobs directly from links (LinkedIn, Greenhouse, Lever, Ashby, Indeed, etc.).
Placing the **Job URL** input as the **first action** and automatically extracting job metadata from the URL drastically reduces friction, eliminating manual typing and transcription errors.

---

## 2. User Journey & Core Requirements
1. **First Action in Modal**: When opening "Save Job Opportunity", the first focused input is **Job Posting URL** with a prominent "Paste job link..." callout.
2. **Instant Trigger**:
   - Pasting a URL (`onPaste`) or entering a URL and clicking "Fetch details" (or pressing Enter) immediately starts metadata extraction.
   - A pulsing "Fetching role details..." spinner informs the user.
3. **Smart Auto-Fill**:
   - The system populates:
     - `companyName` (e.g. "Linear", "Stripe")
     - `position` (e.g. "Staff Frontend Engineer")
     - `source` (e.g. "Greenhouse", "Lever", "LinkedIn")
     - `location` (e.g. "San Francisco, CA")
     - `workSetup` ("REMOTE" | "HYBRID" | "ONSITE")
     - `salaryMin` & `salaryMax` (if disclosed in posting)
     - `description` (clean markdown/text snippet of the role overview)
4. **Resilience & Fallback**:
   - If a URL cannot be fetched (CORS/bot protection/timeout/auth wall), it falls back to URL slug heuristics (e.g., `boards.greenhouse.io/stripe/jobs/...` extracts Company: Stripe, Platform: Greenhouse) and notifies the user with a gentle banner without blocking manual input.
5. **Security**:
   - SSRF protection: reject loopback (`127.0.0.1`, `localhost`), internal private IPs (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and AWS metadata endpoints (`169.254.169.254`).
   - Abort timeout: max 5 seconds.
   - Size limit: stream max 1MB HTML payload.

---

## 3. Architecture & API Contract

### Route: `POST /api/v1/applications/parse-job-url`
- **Auth**: Protected by Bearer token (`requireAuth`).
- **Request Body**:
  ```json
  {
    "url": "https://boards.greenhouse.io/figma/jobs/123456"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "data": {
      "url": "https://boards.greenhouse.io/figma/jobs/123456",
      "companyName": "Figma",
      "position": "Software Engineer, Frontend",
      "source": "Greenhouse",
      "location": "San Francisco, CA",
      "workSetup": "HYBRID",
      "salaryMin": 165000,
      "salaryMax": 210000,
      "currency": "USD",
      "description": "...",
      "extractedVia": "json-ld"
    }
  }
  ```

---

## 4. Extraction Strategy Hierarchy
1. **JSON-LD Schema (`<script type="application/ld+json">`)**:
   - Standard Schema.org `JobPosting` schema used by Greenhouse, Lever, Ashby, LinkedIn, Indeed, Google Jobs.
2. **OpenGraph & Twitter Meta Tags**:
   - `og:site_name`, `og:title`, `og:description`, `twitter:title`.
3. **HTML Metadata**:
   - `<title>` tag parser (e.g. "Senior Engineer at Acme").
4. **URL & Domain Heuristics**:
   - Domain mapping (e.g., `greenhouse.io` -> `Greenhouse`, `lever.co` -> `Lever`).
   - Path slug parser (e.g., `/company/jobs/123` -> company name).
