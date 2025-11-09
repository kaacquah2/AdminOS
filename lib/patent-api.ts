// ============================================
// PATENT DATABASE INTEGRATION
// ============================================

/**
 * Patent API Integration Module
 * 
 * This module provides integration with external patent databases:
 * - USPTO (United States Patent and Trademark Office) - PatentsView API (free, no key) or USPTO Data Set API (requires key)
 * - EPO (European Patent Office) - Open Patent Services (OPS) API (requires credentials)
 * - WIPO (World Intellectual Property Organization) - PATENTSCOPE API (requires registration)
 * 
 * API Documentation:
 * - USPTO PatentsView: https://patentsview.org/apis/api-endpoints/patents
 * - USPTO Developer Hub: https://developer.uspto.gov/
 * - EPO OPS: https://developers.epo.org/
 * - WIPO PATENTSCOPE: https://www.wipo.int/patentscope/en/data/
 */

export interface PatentSearchResult {
  patentNumber: string
  title: string
  abstract?: string
  inventors: string[]
  filingDate: string
  publicationDate?: string
  grantDate?: string
  patentOffice: string
  status: string
  url?: string
}

export interface PatentSearchParams {
  query: string
  office?: "USPTO" | "EPO" | "WIPO" | "ALL"
  limit?: number
  startDate?: string
  endDate?: string
}

/**
 * Search patents across multiple patent offices
 */
export async function searchPatents(params: PatentSearchParams): Promise<PatentSearchResult[]> {
  const { query, office = "ALL", limit = 50 } = params
  const results: PatentSearchResult[] = []

  try {
    if (office === "USPTO" || office === "ALL") {
      try {
        const usptoResults = await searchUSPTO(query, limit)
        results.push(...usptoResults)
      } catch (error) {
        console.error("USPTO search error:", error)
        // Continue with other offices even if one fails
      }
    }

    if (office === "EPO" || office === "ALL") {
      try {
        const epoResults = await searchEPO(query, limit)
        results.push(...epoResults)
      } catch (error) {
        console.error("EPO search error:", error)
        // Continue with other offices even if one fails
      }
    }

    if (office === "WIPO" || office === "ALL") {
      try {
        const wipoResults = await searchWIPO(query, limit)
        results.push(...wipoResults)
      } catch (error) {
        console.error("WIPO search error:", error)
        // Continue with other offices even if one fails
      }
    }

    return results.slice(0, limit)
  } catch (error) {
    console.error("Error searching patents:", error)
    throw error
  }
}

/**
 * Search USPTO patents using PatentsView API (free, no key required)
 * Alternative: USPTO Data Set API (requires API key from developer.uspto.gov)
 */
async function searchUSPTO(query: string, limit: number): Promise<PatentSearchResult[]> {
  if (!PATENT_API_CONFIG.USPTO.enabled) {
    return []
  }

  try {
    // PatentsView API - Free, no authentication required
    // Search in patent title
    const searchQuery = {
      _and: [
        {
          _text_any: {
            patent_title: query
          }
        }
      ]
    }

    const fields = [
      "patent_number",
      "patent_title",
      "inventor_name",
      "patent_date",
      "grant_date",
      "patent_abstract"
    ]

    const url = `${PATENT_API_CONFIG.USPTO.baseUrl}/patents/query?q=${encodeURIComponent(JSON.stringify(searchQuery))}&f=${JSON.stringify(fields)}&o=${JSON.stringify({ page: 1, per_page: limit })}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`USPTO API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.patents || data.patents.length === 0) {
      return []
    }

    // Transform PatentsView results to our format
    return data.patents.map((patent: any) => ({
      patentNumber: patent.patent_number || "",
      title: patent.patent_title || "",
      abstract: patent.patent_abstract || undefined,
      inventors: patent.inventor_name || [],
      filingDate: patent.patent_date || "",
      grantDate: patent.grant_date || undefined,
      patentOffice: "USPTO",
      status: patent.grant_date ? "granted" : "pending",
      url: patent.patent_number ? `https://patentsview.org/patents/${patent.patent_number}` : undefined,
    }))
  } catch (error) {
    console.error("Error searching USPTO patents:", error)
    // Return empty array instead of throwing to allow other offices to be searched
    return []
  }
}

/**
 * Search EPO patents using free Espacenet public search
 * Espacenet is free and doesn't require API keys
 * URL: https://worldwide.espacenet.com
 */
async function searchEPO(query: string, limit: number): Promise<PatentSearchResult[]> {
  if (!PATENT_API_CONFIG.EPO.enabled) {
    return []
  }

  try {
    // Espacenet doesn't have a public API, but we can provide search URLs
    // For now, return a result that links to Espacenet search
    // Users can click the link to see results on Espacenet website
    
    // Try to use Espacenet's public search endpoint if available
    // Note: This is a simplified approach - Espacenet primarily uses web interface
    const searchUrl = `${PATENT_API_CONFIG.EPO.searchUrl}?submitted=true&locale=en_EP&DB=EPODOC&query=${encodeURIComponent(query)}`
    
    // Return a placeholder result with search URL
    // In a real implementation, you might want to scrape the results page
    // or use a service that provides Espacenet data
    return [{
      patentNumber: "EPO_SEARCH",
      title: `View Espacenet search results for: "${query}"`,
      abstract: `Click the link to view search results on Espacenet (over 140 million patents)`,
      patentOffice: "EPO",
      status: "search_link",
      url: searchUrl,
    }]
  } catch (error) {
    console.error("Error searching EPO patents:", error)
    return []
  }
}

/**
 * Search WIPO patents using free PATENTSCOPE public search
 * PATENTSCOPE is free and doesn't require API keys
 * URL: https://patentscope.wipo.int
 */
async function searchWIPO(query: string, limit: number): Promise<PatentSearchResult[]> {
  if (!PATENT_API_CONFIG.WIPO.enabled) {
    return []
  }

  try {
    // PATENTSCOPE doesn't have a public API, but we can provide search URLs
    // Users can click the link to see results on PATENTSCOPE website
    
    // PATENTSCOPE search URL with query parameters
    const searchUrl = `${PATENT_API_CONFIG.WIPO.searchUrl}?query=${encodeURIComponent(query)}`
    
    // Return a placeholder result with search URL
    // In a real implementation, you might want to scrape the results page
    // or use a service that provides PATENTSCOPE data
    return [{
      patentNumber: "WIPO_SEARCH",
      title: `View PATENTSCOPE search results for: "${query}"`,
      abstract: `Click the link to view search results on WIPO PATENTSCOPE (international patents)`,
      patentOffice: "WIPO",
      status: "search_link",
      url: searchUrl,
    }]
  } catch (error) {
    console.error("Error searching WIPO patents:", error)
    return []
  }
}

/**
 * Get patent details by patent number
 */
export async function getPatentDetails(patentNumber: string, office: "USPTO" | "EPO" | "WIPO"): Promise<PatentSearchResult | null> {
  try {
    switch (office) {
      case "USPTO":
        return await getUSPTODetails(patentNumber)
      case "EPO":
        return await getEPODetails(patentNumber)
      case "WIPO":
        return await getWIPODetails(patentNumber)
      default:
        return null
    }
  } catch (error) {
    console.error("Error fetching patent details:", error)
    throw error
  }
}

/**
 * Get USPTO patent details
 */
async function getUSPTODetails(patentNumber: string): Promise<PatentSearchResult | null> {
  try {
    const searchQuery = {
      _eq: {
        patent_number: patentNumber
      }
    }

    const fields = [
      "patent_number",
      "patent_title",
      "inventor_name",
      "patent_date",
      "grant_date",
      "patent_abstract",
      "assignee_name"
    ]

    const url = `${PATENT_API_CONFIG.USPTO.baseUrl}/patents/query?q=${encodeURIComponent(JSON.stringify(searchQuery))}&f=${JSON.stringify(fields)}`

    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()
    if (!data.patents || data.patents.length === 0) return null

    const patent = data.patents[0]
    return {
      patentNumber: patent.patent_number || "",
      title: patent.patent_title || "",
      abstract: patent.patent_abstract || undefined,
      inventors: patent.inventor_name || [],
      filingDate: patent.patent_date || "",
      grantDate: patent.grant_date || undefined,
      patentOffice: "USPTO",
      status: patent.grant_date ? "granted" : "pending",
      url: `https://patentsview.org/patents/${patent.patent_number}`,
    }
  } catch (error) {
    console.error("Error fetching USPTO patent details:", error)
    return null
  }
}

/**
 * Get EPO patent details using free Espacenet
 */
async function getEPODetails(patentNumber: string): Promise<PatentSearchResult | null> {
  try {
    // Espacenet patent detail URL (free, no API key needed)
    return {
      patentNumber,
      title: `EPO Patent ${patentNumber}`,
      patentOffice: "EPO",
      status: "published",
      url: `https://worldwide.espacenet.com/patent/search/family/${patentNumber}/en`,
    }
  } catch (error) {
    console.error("Error fetching EPO patent details:", error)
    return null
  }
}

/**
 * Get WIPO patent details using free PATENTSCOPE
 */
async function getWIPODetails(patentNumber: string): Promise<PatentSearchResult | null> {
  try {
    // PATENTSCOPE patent detail URL (free, no API key needed)
    return {
      patentNumber,
      title: `WIPO Patent ${patentNumber}`,
      patentOffice: "WIPO",
      status: "published",
      url: `https://patentscope.wipo.int/search/en/detail.jsf?docId=${patentNumber}`,
    }
  } catch (error) {
    console.error("Error fetching WIPO patent details:", error)
    return null
  }
}

/**
 * Check for similar patents (prior art search)
 */
export async function checkPriorArt(patentTitle: string, technologyArea?: string): Promise<PatentSearchResult[]> {
  try {
    // In production, perform comprehensive prior art search
    // This would search across all patent offices for similar inventions
    
    const results = await searchPatents({
      query: patentTitle,
      office: "ALL",
      limit: 100,
    })

    // Filter and rank by similarity
    // In production, use NLP/ML models to determine similarity
    
    return results.slice(0, 20) // Return top 20 most relevant
  } catch (error) {
    console.error("Error checking prior art:", error)
    throw error
  }
}

/**
 * Monitor patent status changes
 * This would be called periodically to check for status updates
 */
export async function monitorPatentStatus(patentNumbers: string[], office: "USPTO" | "EPO" | "WIPO"): Promise<any[]> {
  try {
    // In production, check patent status for each patent number
    // Return array of status updates
    
    return []
  } catch (error) {
    console.error("Error monitoring patent status:", error)
    throw error
  }
}

/**
 * Integration configuration
 * All APIs are configured to use FREE public endpoints that don't require API keys
 * 
 * Free Public Sources:
 * - USPTO: PatentsView API (free, no key required) ✅
 * - EPO: Espacenet public search (free, no key required) ✅
 * - WIPO: PATENTSCOPE public search (free, no key required) ✅
 */
export const PATENT_API_CONFIG = {
  USPTO: {
    enabled: true,
    baseUrl: "https://api.patentsview.org",
    usePatentsView: true, // Free PatentsView API - no key needed
  },
  EPO: {
    enabled: true,
    baseUrl: "https://worldwide.espacenet.com",
    searchUrl: "https://worldwide.espacenet.com/searchResults",
  },
  WIPO: {
    enabled: true,
    baseUrl: "https://patentscope.wipo.int",
    searchUrl: "https://patentscope.wipo.int/search/en/search.jsf",
  },
}


