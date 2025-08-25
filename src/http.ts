const defaultTimeOut = parseInt(process.env.TIMEOUT_PER_REQUEST || "10000")
const baseUrl = process.env.BASE_URL || "https://qa-challenge-nine.vercel.app"
const apiUrl = process.env.API_URL || "/api/name-checker"
const fullUrl = `${baseUrl}${apiUrl}`

type CallResult = {
    url: string,
    nameParameter: string,
    status: number,
    body: unknown | string, 
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
        let body: unknown | string = null
        let errorMsg: string | null = null

        try {
            body = await response.json()
            if (typeof body === "object" && body !== null) {
                errorMsg = (body as any).error ?? (body as any).message ?? null
            }
        } catch (error) {
            body = await response.text()
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
        return {
            url: fullUrl,
            nameParameter,
            status: 0,
            body: null,
            latencyMs: performance.now() - startTimer,
            errorMsg: error instanceof Error ? error.message : "Unknown error"
        }
    } finally {
        clearTimeout(timer)
    }
}