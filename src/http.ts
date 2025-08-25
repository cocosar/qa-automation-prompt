const defaultTimeOut = parseInt(process.env.TIMEOUT_PER_REQUEST || "10000")
const baseUrl = process.env.BASE_URL || "https://qa-challenge-nine.vercel.app"
const apiUrl = process.env.API_URL || "/api/name-checker"
const fullUrl = `${baseUrl}${apiUrl}`

type ApiResponse = {
    name?: string
    error?: string
    message?: string
}

type CallResult = {
    url: string,
    nameParameter: string,
    status: number,
    body: ApiResponse, 
    latencyMs: number,
    errorMsg: string | null
}

export const callApi = async (nameParameter: any): Promise<CallResult> => {

    const startTimer = performance.now()
    const abortController = new AbortController()
    const timer = setTimeout(() => abortController.abort(), defaultTimeOut)

    try {
        const response = await fetch(fullUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name: nameParameter }),
            signal: abortController.signal
        })

        const status = response.status
        let body: ApiResponse = {}
        let errorMsg: string | null = null

        if (!response.ok) {
            errorMsg = `HTTP ${status}: ${response.statusText || 'Request failed'}`
        }

        try {
            body = await response.json()
            if (typeof body === "object" && body !== null) {
                if (response.ok) {
                    errorMsg = (body as any).error ?? (body as any).message ?? null
                } else {
                    const bodyStr = JSON.stringify(body)
                    if (bodyStr !== '{}' && bodyStr !== 'null') {
                        errorMsg += ` - Response: ${bodyStr}`
                    }
                }
            }
        } catch (parseError) {
            try {
                const bodyStr = await response.text() as string
                if (!response.ok && typeof bodyStr === "string" && bodyStr.trim()) {
                    errorMsg += ` - Response: ${bodyStr}`
                }
            } catch (textError) {
                body = {}
                if (!response.ok) {
                    errorMsg += " - Unable to parse response body"
                }
            }
        }
        
        const latencyMs = performance.now() - startTimer
        return {
            url: fullUrl,
            nameParameter,
            status,
            body,
            latencyMs,
            errorMsg
        }
    } catch (error) {
        const latencyMs = performance.now() - startTimer
        let errorMessage = "Unknown network error"
        
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                errorMessage = `Request timeout after ${defaultTimeOut}ms`
            } else if (error.message.includes('fetch')) {
                errorMessage = `Network error: ${error.message}`
            } else {
                errorMessage = error.message
            }
        }

        return {
            url: fullUrl,
            nameParameter,
            status: 0,
            body: {},
            latencyMs,
            errorMsg: errorMessage
        }
    } finally {
        clearTimeout(timer)
    }
}