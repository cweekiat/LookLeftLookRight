'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { uploadCSV, fetchPortfolioMetrics, fetchPortfolioValueOverTime, fetchPortfolioOptimization, fetchDCASimulation } from '@/lib/fetcher'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'

interface Metrics {
  total_invested: number
  current_value: number
  profit: number
  cagr: number
  net_shares: { [ticker: string]: number }
}

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null)
  const [portfolioId, setPortfolioId] = useState<number | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [monthlyData, setMonthlyData] = useState<{ month: string; value: number }[]>([])
  const [optimizedMetrics, setOptimizedMetrics] = useState<Metrics | null>(null)
  const [optimizedPieData, setOptimizedPieData] = useState<{ name: string; value: number }[]>([])
  const [dcaData, setDcaData] = useState<{ month: string; actual: number; optimized: number }[]>([])
  const [monthlyContribution, setMonthlyContribution] = useState<number>(500)
  const [dcaYears, setDcaYears] = useState<number>(10)
  const [tab, setTab] = useState('overview')
  const [targetCAGR, setTargetCAGR] = useState<number>(30) // Default to 30%

  const userId = 'user-1234'

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#a4de6c', '#d0ed57']

  const formatCurrency = (value: number | string | null | undefined): string => {
    if (typeof value !== 'number' || isNaN(value)) return '$0.00'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
  }
  

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
      if (metricsResponse && metricsResponse.metrics) {
        setMetrics(metricsResponse.metrics)
      }

      const valueOverTimeResponse = await fetchPortfolioValueOverTime(uploadResult.portfolio_id, userId, '/portfolio/value-over-time')
      if (valueOverTimeResponse && valueOverTimeResponse.monthly_portfolio_value) {
        const monthlyValues = Object.entries(valueOverTimeResponse.monthly_portfolio_value).map(([month, value]) => ({
          month: new Date(month + "-01").toLocaleString('default', { month: 'short', year: 'numeric' }),
          value: value as number,
        }))
        setMonthlyData(monthlyValues)
      }
    } catch (err) {
      console.error('Upload failed:', err)
      setStatusMessage('Upload or metrics fetch failed. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'optimization' && portfolioId) {
      handleOptimization()
    }
  }, [tab, portfolioId])
  

  const handleOptimization = async () => {
    if (!portfolioId) return
    const targetDecimal = targetCAGR / 100
    try {
      const optimizationResult = await fetchPortfolioOptimization(portfolioId, targetDecimal, userId, '/portfolio/optimize')
      const { optimization_result } = optimizationResult

      if (!optimization_result || !optimization_result.net_shares) {
        setStatusMessage("Optimization failed. Allocation data is missing.")
        return
      }

      setOptimizedMetrics({
        total_invested: optimization_result.total_invested,
        current_value: optimization_result.current_value,
        profit: optimization_result.profit,
        cagr: optimization_result.cagr,
        net_shares: optimization_result.net_shares
      })

      const pieData2 = Object.entries(optimization_result.net_shares).map(([ticker, shares]) => ({
        name: ticker,
        value: Number(shares),
      }))
      setOptimizedPieData(pieData2)

      const dcaSimResult = await fetchDCASimulation(
        portfolioId,
        userId,
        '/portfolio/dca-simulation',
        metrics?.current_value || 0,
        monthlyContribution,
        dcaYears,
        targetDecimal
      )

      if (
        !dcaSimResult ||
        !Array.isArray(dcaSimResult.dates) ||
        !Array.isArray(dcaSimResult.actual_portfolio_values) ||
        !Array.isArray(dcaSimResult.optimized_portfolio_values) ||
        dcaSimResult.dates.length !== dcaSimResult.actual_portfolio_values.length ||
        dcaSimResult.dates.length !== dcaSimResult.optimized_portfolio_values.length
      ) {
        console.error('Invalid DCA Simulation Response:', dcaSimResult)
        setStatusMessage("DCA Simulation failed. Response structure is unexpected.")
        return
      }

      const dcaFormatted = dcaSimResult.dates.map((date: string, index: number) => ({
        month: new Date(date + "-01").toLocaleString('default', { month: 'short', year: 'numeric' }),
        actual: Number(dcaSimResult.actual_portfolio_values[index]),
        optimized: Number(dcaSimResult.optimized_portfolio_values[index])
      }))
      setDcaData(dcaFormatted)
    } catch (error) {
      console.error("Optimization error:", error)
      setStatusMessage("An error occurred during optimization.")
    }
  }

  const pieData1 = metrics
    ? Object.entries(metrics.net_shares).map(([ticker, shares]) => ({
        name: ticker,
        value: shares
      }))
    : []

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
            {file && <span className='text-xs text-muted-foreground'>{file.name}</span>}
            <Button onClick={handleUpload} size='sm' disabled={loading || !file}>
              {loading ? 'Uploading...' : 'Upload CSV'}
            </Button>
          </div>
        </div>

        {statusMessage && (
          <div className='mb-2 text-sm text-muted-foreground'>
            {statusMessage}
          </div>
        )}
        <Tabs value={tab} onValueChange={setTab} orientation='vertical' defaultValue='overview' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='optimization'>Optimisation</TabsTrigger>
            {/* <TabsTrigger value='analytics'>Analytics</TabsTrigger>
            <TabsTrigger value='trending'>Trending</TabsTrigger> */}
          </TabsList>

          {/* Overview */}
          <TabsContent value='overview' className='space-y-2'>
            <div className='grid gap-4 sm:grid-cols-4 lg:grid-cols-4'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Total Portfolio Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-xl font-bold'>
                    {metrics ? formatCurrency(metrics.current_value) : '...'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Total Invested</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-xl font-bold'>
                    {metrics ? formatCurrency(metrics.total_invested) : '...'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Profits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-xl font-bold'>
                    {metrics ? formatCurrency(metrics.profit) : '...'}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>DCA CAGR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-xl font-bold'>
                    {metrics ? `${metrics.cagr.toFixed(2)}%` : '...'}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className='grid grid-cols-1 gap-2 lg:grid-cols-2'>
            <ChartCard title='Portfolio Value Over Time'>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width='100%' height='100%'>
                    <LineChart
                      data={monthlyData}
                      margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey='month' tickLine={true} axisLine={false} tickMargin={6} />
                      <YAxis 
                        tickFormatter={(value: any) => {
                          if (typeof value !== 'number') return '';
                          return `$${Math.round(value).toLocaleString()}`; // Rounded Y-axis values
                        }} 
                      />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Line dataKey='value' type='monotone' stroke='#8884d8' strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className='text-muted-foreground text-xs'>No data for line chart</p>
                )}
              </ChartCard>

              <ChartCard title='Portfolio Allocation'>
                {pieData1.length > 0 ? (
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart margin={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                      <Tooltip formatter={(value) => `${value} shares`} />
                      <Pie
                        data={pieData1}
                        dataKey='value'
                        nameKey='name'
                        outerRadius={90}
                        label={({ name, value, percent }) =>
                          `${name}: ${value} shares (${(percent * 100).toFixed(1)}%)`
                        }
                        labelLine={false}
                      >
                        {pieData1.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className='text-muted-foreground text-xs'>No data for pie chart</p>
                )}
              </ChartCard>
            </div>
          </TabsContent>

          {/* Optimization */}
          <TabsContent value='optimization' className='space-y-4'>
            {/* User Inputs */}
            <Card>
              <CardHeader>
                <CardTitle>Optimization Inputs</CardTitle>
              </CardHeader>
              <CardContent className='flex flex-col gap-4'>
                <div className='flex flex-wrap items-center gap-4'>
                  <div className='flex items-center gap-2'>
                    <label className='text-sm font-medium'>Target CAGR (%):</label>
                    <input
                      type='number'
                      value={targetCAGR}
                      onChange={(e) => setTargetCAGR(parseFloat(e.target.value))}
                      step="1"
                      className='border px-2 py-1 text-sm rounded w-24'
                    />
                  </div>
                  <div className='flex items-center gap-2'>
                    <label className='text-sm font-medium'>Monthly Contribution:</label>
                    <input
                      type='number'
                      value={monthlyContribution}
                      onChange={(e) => setMonthlyContribution(parseFloat(e.target.value))}
                      className='border px-2 py-1 text-sm rounded w-24'
                    />
                  </div>
                  <div className='flex items-center gap-2'>
                    <label className='text-sm font-medium'>Years:</label>
                    <input
                      type='number'
                      value={dcaYears}
                      onChange={(e) => setDcaYears(parseInt(e.target.value))}
                      className='border px-2 py-1 text-sm rounded w-24'
                    />
                  </div>
                  <Button size='sm' onClick={handleOptimization}>
                    Optimize
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className='grid gap-2 sm:grid-cols-4 lg:grid-cols-4'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Optimized Portfolio Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-xl font-bold'>
                    {optimizedMetrics ? formatCurrency(optimizedMetrics.current_value) : '...'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Total Invested</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-xl font-bold'>
                    {optimizedMetrics ? formatCurrency(optimizedMetrics.total_invested) : '...'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Profits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-xl font-bold'>
                    {optimizedMetrics ? formatCurrency(optimizedMetrics.profit) : '...'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Optimized CAGR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-xl font-bold'>
                    {optimizedMetrics ? `${optimizedMetrics.cagr.toFixed(2)}%` : '...'}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className='grid grid-cols-1 gap-2 lg:grid-cols-2'>
            <ChartCard title='DCA Simulation: Actual vs Optimized'>
              {dcaData.length > 0 ? (
                <>
                  {/* Shortened Dynamic Summary */}
                  <div className="px-0 pt-1 text-xs text-muted-foreground">
                    Starting with 
                    <span className="font-semibold text-foreground"> {formatCurrency(metrics?.current_value || 0)} </span>, 
                    adding 
                    <span className="font-semibold text-foreground"> {formatCurrency(monthlyContribution)} </span>/month, 
                    at <span className="font-semibold text-foreground">{targetCAGR.toFixed(1)}% annual</span>, 
                    you'll grow to 
                    <span className="font-bold text-green-600 text-base"> {formatCurrency(dcaData[dcaData.length - 1]?.optimized || 0)} </span> 
                    vs 
                    <span className="font-bold text-red-500 text-base"> {formatCurrency(dcaData[dcaData.length - 1]?.actual || 0)} </span> 
                    in <span className="font-semibold text-foreground"> {dcaYears} yrs</span>.
                  </div>

                  {/* Add spacing after sentence */}
                  <div className="mb-2" />

                  <ResponsiveContainer width='100%' height={280}>
                    <LineChart data={dcaData} margin={{ left: 60, right: 24, top: 12, bottom: 12 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis 
                        dataKey='month' 
                        tickFormatter={(monthStr: string) => {
                          // If format is "May 2025", extract year part
                          const parts = monthStr.split(' ')
                          return parts.length === 2 ? parts[1] : ''
                        }} 
                        tickLine={false} 
                        axisLine={true} 
                        tickMargin={8} 
                      />
                      <YAxis 
                        tickFormatter={(value: any) => {
                          if (typeof value !== 'number') return '';
                          return `$${Math.round(value).toLocaleString()}`; // Rounded Y-axis values
                        }} 
                      />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Line dataKey='actual' type='monotone' stroke='#ef4444' strokeWidth={2} dot={false} name="Actual Portfolio" />
                      <Line dataKey='optimized' type='monotone' stroke='#22c55e' strokeWidth={2} dot={false} name="Optimized Portfolio" />
                    </LineChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <p className='text-muted-foreground text-xs'>No data for DCA simulation</p>
              )}
            </ChartCard>

            <ChartCard title='Optimized Portfolio Allocation'>
              {optimizedPieData.length > 0 ? (
                <ResponsiveContainer width='100%' height={300}>
                  <PieChart>
                    <Tooltip formatter={(value) => `${value} shares`} />
                    <Pie
                      data={optimizedPieData}
                      dataKey='value'
                      nameKey='name'
                      outerRadius={90}
                      label={({ name, value, percent }) => {
                        if (value === 0) return ''; // Skip label if value is 0
                        return `${name}: ${value} shares (${(percent * 100).toFixed(1)}%)`;
                      }}
                      labelLine={false}
                    >
                      {optimizedPieData.map((_, index) => (
                        <Cell key={`cell-optimized-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className='text-muted-foreground text-xs'>No data for optimized pie chart</p>
              )}
            </ChartCard>
            </div>
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}


function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-sm'>{title}</CardTitle>
      </CardHeader>
      <CardContent className='h-[320px]'>{children}</CardContent>
    </Card>
  )
}
