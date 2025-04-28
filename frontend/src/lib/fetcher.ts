const BASE_URL = '/api'

export async function uploadCSV(file: File, userId: string, endpoint: string = '/portfolio/upload') {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'X-User-Id': userId
    },
    body: formData
  })

  if (!response.ok) {
    console.error('Upload failed:', response.statusText)
    throw new Error(`Upload failed: ${response.statusText}`)
  }

  const data = await response.json()
  console.log('Upload response:', data)
  return data
}

export async function fetchPortfolioMetrics(portfolioId: number, userId: string, endpoint: string = '/portfolio/metrics') {
  const url = `${BASE_URL}${endpoint}/${portfolioId}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-User-Id': userId
    }
  })

  if (!response.ok) {
    console.error('Metrics fetch failed:', response.statusText)
    throw new Error(`Metrics fetch failed: ${response.statusText}`)
  }

  const data = await response.json()
  console.log('Metrics response:', data)
  return data
}

export async function fetchPortfolioValueOverTime(portfolioId: number, userId: string, endpoint: string = '/portfolio/value-over-time') {
    const url = `${BASE_URL}${endpoint}/${portfolioId}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-User-Id': userId,
      },
    });
  
    if (!response.ok) {
      throw new Error(`Error fetching portfolio value over time: ${response.statusText}`);
    }
  
    return await response.json();
  }

export async function fetchPortfolioOptimization(portfolioId: number, targetReturn: number, userId: string, endpoint: string) {
const response = await fetch(`${BASE_URL}${endpoint}/${portfolioId}?target_return=${targetReturn}`, {
    method: 'GET',
    headers: { 'X-User-Id': userId },
});
if (!response.ok) throw new Error('Failed to fetch optimization');
return await response.json();
}

export async function fetchDCASimulation(portfolioId: number, userId: string, endpoint: string, initialInvestment: number, monthlyContribution: number, years: number, targetReturn: number) {
const response = await fetch(`${BASE_URL}${endpoint}/${portfolioId}?initial_investment=${initialInvestment}&monthly_contribution=${monthlyContribution}&years=${years}&target_return=${targetReturn}`, {
    method: 'GET',
    headers: { 'X-User-Id': userId },
});
if (!response.ok) throw new Error('Failed to fetch DCA simulation');
return await response.json();
}
    
