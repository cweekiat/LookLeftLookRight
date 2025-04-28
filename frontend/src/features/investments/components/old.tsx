'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { uploadCSV, fetchPortfolioMetrics, fetchPortfolioValueOverTime } from '@/lib/fetcher'
import { fetchPortfolioOptimization, fetchDCASimulation } from '@/lib/fetcher'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LabelList } from 'recharts'  
import { LineChart, Line, XAxis, CartesianGrid } from 'recharts'
// import { TrendingUp, TrendingDown } from 'lucide-react'

interface Metrics {
  total_invested: number
  current_value: number
  profit: number
  cagr: number
  net_shares: {[ticker: string]: number}
}

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null)
  const [portfolioId, setPortfolioId] = useState<number | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [monthlyData, setMonthlyData] = useState<{ month: string; value: number }[]>([])
  const [targetCAGR, setTargetCAGR] = useState<number>(0.1)
  const [optimizedMetrics, setOptimizedMetrics] = useState<Metrics | null>(null)
  const [optimizedPieData, setOptimizedPieData] = useState<{ name: string; value: number }[]>([])
  const [dcaData, setDcaData] = useState<{ month: string; actual: number; optimized: number }[]>([])
  const [monthlyContribution, setMonthlyContribution] = useState<number>(500)
  const [dcaYears, setDcaYears] = useState<number>(10)

  const userId = 'user-1234' // TODO: Replace with real auth
  

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setStatusMessage(`Selected file: ${e.target.files[0].name}`)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setStatusMessage('Please select a CSV file before uploading.')
      return
    }
    setLoading(true)
    setStatusMessage('Uploading file...')
    try {
      const uploadResult = await uploadCSV(file, userId, '/portfolio/upload')
      setPortfolioId(uploadResult.portfolio_id)
      setStatusMessage(`Upload successful!`)

      const metricsResponse = await fetchPortfolioMetrics(uploadResult.portfolio_id, userId, '/portfolio/metrics')
      console.log("Fetched Metrics Response:", metricsResponse)
      if (metricsResponse && metricsResponse.metrics) {
        setMetrics(metricsResponse.metrics)
      } else {
        console.error("Metrics response does not have 'metrics' key.")
      }

      const valueOverTimeResponse = await fetchPortfolioValueOverTime(uploadResult.portfolio_id, userId, '/portfolio/value-over-time')
      if (valueOverTimeResponse && valueOverTimeResponse.monthly_portfolio_value) {
        const monthlyValues = Object.entries(valueOverTimeResponse.monthly_portfolio_value).map(([month, value]) => ({
          month: new Date(month + "-01").toLocaleString('default', { month: 'short', year: 'numeric' }),
          value: value as number,
        }))
        setMonthlyData(monthlyValues)
      }

    } catch (err: any) {
      console.error('Upload failed:', err)
      setStatusMessage('Upload or metrics fetch failed. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (metrics) {
      console.log("Updated Metrics State:", metrics)
    }
  }, [metrics])

  const handleOptimization = async () => {
    if (!portfolioId) return
    try {
      const optimizationResult = await fetchPortfolioOptimization(portfolioId, targetCAGR, userId, '/portfolio/optimize')
      const { optimization_result } = optimizationResult
  
      // Defensive check for null/undefined allocation
      if (!optimization_result || !optimization_result.net_shares) {
        console.error("Optimization result or allocation is null/undefined", optimization_result)
        setStatusMessage("Optimization failed. Allocation data is missing.")
        return
      }
  
      // Set Optimized Metrics
      setOptimizedMetrics({
        total_invested: optimization_result.total_invested,
        current_value: optimization_result.current_value,
        profit: optimization_result.profit,
        cagr: optimization_result.cagr,
        net_shares: optimization_result.net_shares
      })
  
      // Safely map pieData
      const pieData2 = Object.entries(optimization_result.net_shares).map(([ticker, shares]) => ({
        name: ticker,
        value: Number(shares),
      }))
      console.log("Optimized Pie Data:", pieData2)
      setOptimizedPieData(pieData2)
  
      // Fetch DCA Simulation
      const dcaSimResult = await fetchDCASimulation(
        portfolioId,
        userId,
        '/portfolio/dca-simulation',
        metrics?.current_value || 0,
        monthlyContribution,
        dcaYears,
        targetCAGR
      )
  
      if (!dcaSimResult || !dcaSimResult.dates || !dcaSimResult.actual_portfolio_values || !dcaSimResult.optimized_portfolio_values) {
        console.error("Invalid DCA Simulation Result Structure:", dcaSimResult)
        setStatusMessage("DCA Simulation failed. Response structure is unexpected.")
        return
      }
      
      const dcaFormatted = dcaSimResult.dates.map((date: string, index: number) => ({
        month: new Date(date + "-01").toLocaleString('default', { month: 'short', year: 'numeric' }),
        actual: Number(dcaSimResult.actual_portfolio_values[index]),
        optimized: Number(dcaSimResult.optimized_portfolio_values[index])
      }))
      
      console.log("DCA Simulation Data:", dcaFormatted)
      setDcaData(dcaFormatted)      
  
    } catch (error) {
      console.error("Optimization error:", error)
      setStatusMessage("An error occurred during optimization.")
    }
  }
  


  // Prepare pie chart data
  const pieData1 = metrics
    ? Object.entries(metrics.net_shares).map(([ticker, shares]) => ({
        name: ticker,
        value: shares
      }))
    : []

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#a4de6c', '#d0ed57']


  return (
    <>
      <Header>
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <div className='mb-4 flex items-center justify-between space-y-2'>
          <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
          <div className='flex items-center space-x-2'>
            <input type='file' accept='.csv' onChange={handleFileChange} />
            {file && <span className='text-sm text-muted-foreground'>{file.name}</span>}
            <Button onClick={handleUpload} disabled={loading || !file}>
              {loading ? 'Uploading...' : 'Upload CSV'}
            </Button>
          </div>
        </div>

        {statusMessage && (
          <div className='mb-4 text-sm text-muted-foreground'>
            {statusMessage}
          </div>
        )}
{/* 
        {portfolioId && (
          <div className='mb-4 text-sm text-muted-foreground'>
            Portfolio ID: <span className='font-semibold'>{portfolioId}</span>
          </div>
        )} */}

        <Tabs orientation='vertical' defaultValue='overview' className='space-y-4'>
          <div className='w-full overflow-x-auto pb-2'>
            <TabsList>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
              <TabsTrigger value='analytics'>Analytics</TabsTrigger>
              <TabsTrigger value='optimization'>Optimisation</TabsTrigger>
              <TabsTrigger value='trending'>Trending</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value='overview' className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Total Portfolio Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {metrics ? `$${metrics.current_value.toFixed(2)}` : '...'}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Total Invested</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {metrics ? `$${metrics.total_invested.toFixed(2)}` : '...'}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Profits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {metrics ? `$${metrics.profit.toFixed(2)}` : '...'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>DCA CAGR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {metrics ? `${metrics.cagr.toFixed(2)}%` : '...'}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Allocation</CardTitle>
                </CardHeader>
                <CardContent className='h-[300px]'>
                  {pieData1.length > 0 ? (
                    <ResponsiveContainer width='100%' height='100%'>
                      <PieChart>
                        <Tooltip />
                        <Pie data={pieData1} dataKey='value' nameKey='name' outerRadius={100}>
                          {pieData1.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                          <LabelList dataKey="name" position="outside" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className='text-muted-foreground text-sm'>No data for pie chart</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Value Over Time</CardTitle>
                </CardHeader>
                <CardContent className='h-[300px]'>
                  {monthlyData.length > 0 ? (
                    <ResponsiveContainer width='100%' height='100%'>
                      <LineChart data={monthlyData}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey='month' tickLine={false} axisLine={false} tickMargin={8} />
                        <Tooltip />
                        <Line dataKey='value' type='monotone' stroke='#8884d8' strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className='text-muted-foreground text-sm'>No data for line chart</p>
                  )}
                </CardContent>
              </Card>
            </div>


          </TabsContent>
          <TabsContent value='optimization' className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Optimized Portfolio Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {optimizedMetrics ? `$${optimizedMetrics.current_value.toFixed(2)}` : '...'}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Total Invested</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {optimizedMetrics ? `$${optimizedMetrics.total_invested.toFixed(2)}` : '...'}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Profits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {optimizedMetrics ? `$${optimizedMetrics.profit.toFixed(2)}` : '...'}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Optimized CAGR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {optimizedMetrics ? `${optimizedMetrics.cagr.toFixed(2)}%` : '...'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Inputs */}
            <Card>
              <CardHeader>
                <CardTitle>Optimization Inputs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex flex-col gap-4'>
                  <div className='flex items-center gap-2'>
                    <label className='text-sm font-medium'>Target CAGR (%):</label>
                    <input
                      type='number'
                      value={targetCAGR}
                      onChange={(e) => setTargetCAGR(parseFloat(e.target.value))}
                      step="0.01"
                      className='border px-2 py-1 text-sm rounded w-24'
                    />
                    <Button size='sm' onClick={handleOptimization}>Optimize</Button>
                  </div>
                  <div className='flex items-center gap-2'>
                    <label className='text-sm font-medium'>Monthly Contribution:</label>
                    <input
                      type='number'
                      value={monthlyContribution}
                      onChange={(e) => setMonthlyContribution(parseFloat(e.target.value))}
                      className='border px-2 py-1 text-sm rounded w-24'
                    />
                    <label className='text-sm font-medium'>Years:</label>
                    <input
                      type='number'
                      value={dcaYears}
                      onChange={(e) => setDcaYears(parseInt(e.target.value))}
                      className='border px-2 py-1 text-sm rounded w-24'
                    />
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* Optimized Portfolio Allocation */}
            <Card>
              <CardHeader>
                <CardTitle>Optimized Portfolio Allocation</CardTitle>
              </CardHeader>
              <CardContent className='h-[300px]'>
                {optimizedPieData.length > 0 ? (
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart>
                      <Tooltip />
                      <Pie data={optimizedPieData} dataKey='value' nameKey='name' outerRadius={100}>
                        {optimizedPieData.map((_, index) => (
                          <Cell key={`cell-optimized-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                        <LabelList dataKey="name" position="outside" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className='text-muted-foreground text-sm'>No data for optimized pie chart</p>
                )}
              </CardContent>
            </Card>

            {/* DCA Simulation Comparison Line Chart */}
            <Card>
              <CardHeader>
                <CardTitle>DCA Simulation: Actual vs Optimized</CardTitle>
                <CardDescription>
                  Compare how your actual portfolio performs vs the optimized scenario.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:p-6">
                {dcaData.length > 0 ? (
                  <ResponsiveContainer width='100%' height={300}>
                    <LineChart data={dcaData} margin={{ left: 12, right: 12 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey='month' tickLine={false} axisLine={false} tickMargin={8} />
                      <Tooltip />
                      <Line
                        dataKey="actual"
                        type="monotone"
                        stroke="#82ca9d"
                        strokeWidth={2}
                        dot={false}
                        name="Actual Portfolio"
                      />
                      <Line
                        dataKey="optimized"
                        type="monotone"
                        stroke="#ff7f50"
                        strokeWidth={2}
                        dot={false}
                        name="Optimized Portfolio"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className='text-muted-foreground text-sm'>No data for DCA simulation</p>
                )}
              </CardContent>
            </Card>


          </TabsContent>
          </Tabs>
      </Main>
    </>
  )
}
