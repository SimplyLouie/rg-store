import { useState, useEffect } from 'react';
import { reportsApi } from '../api/reports';
import { DailyReport, RangeReport } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { formatCurrency, formatDate, exportToCsv } from '../lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  TrendingUp,
  ShoppingBag,
  Banknote,
  BarChart3,
  Download,
  Calendar,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'daily' | 'range'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [rangeDays, setRangeDays] = useState(7);
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [rangeReport, setRangeReport] = useState<RangeReport | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (activeTab === 'daily') loadDailyReport();
    else loadRangeReport();
  }, [activeTab, selectedDate, rangeDays]);

  const loadDailyReport = async () => {
    setLoading(true);
    try {
      const data = await reportsApi.getDaily(selectedDate);
      setDailyReport(data);
    } catch {
      toast({ variant: 'destructive', title: 'Failed to load report' });
    } finally {
      setLoading(false);
    }
  };

  const loadRangeReport = async () => {
    setLoading(true);
    try {
      const data = await reportsApi.getRange(rangeDays);
      setRangeReport(data);
    } catch {
      toast({ variant: 'destructive', title: 'Failed to load report' });
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleExportDaily = () => {
    if (!dailyReport) return;
    exportToCsv(`sales-${selectedDate}.csv`, [
      { Date: dailyReport.date, 'Total Revenue': dailyReport.summary.totalRevenue, 'Total Transactions': dailyReport.summary.totalTransactions, 'Avg Transaction': dailyReport.summary.avgTransactionValue },
    ]);
    toast({ title: 'Report exported' });
  };

  const handleExportRange = () => {
    if (!rangeReport) return;
    exportToCsv(`sales-range-${rangeDays}days.csv`, rangeReport.data.map((d) => ({
      Date: d.date, Revenue: d.revenue, Transactions: d.transactions,
    })));
    toast({ title: 'Report exported' });
  };

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
          <p className="text-sm text-gray-500">Track your store performance</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'daily' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'
            }`}
        >
          Daily Report
        </button>
        <button
          onClick={() => setActiveTab('range')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'range' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'
            }`}
        >
          Revenue Trend
        </button>
      </div>

      {activeTab === 'daily' && (
        <>
          {/* Date picker */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate(-1)}
              className="p-2 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="relative flex-1 max-w-xs">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-9"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <button
              onClick={() => navigateDate(1)}
              disabled={selectedDate >= new Date().toISOString().split('T')[0]}
              className="p-2 rounded-lg border hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <Button variant="outline" size="sm" onClick={handleExportDaily} className="gap-1.5 ml-auto">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : dailyReport ? (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Revenue</p>
                        <p className="text-2xl font-bold text-blue-700 mt-1">
                          {formatCurrency(dailyReport.summary.totalRevenue)}
                        </p>
                      </div>
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Banknote className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Transactions</p>
                        <p className="text-2xl font-bold text-green-700 mt-1">
                          {dailyReport.summary.totalTransactions}
                        </p>
                      </div>
                      <div className="bg-green-100 p-2 rounded-lg">
                        <ShoppingBag className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="col-span-2 md:col-span-1">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Sale</p>
                        <p className="text-2xl font-bold text-purple-700 mt-1">
                          {formatCurrency(dailyReport.summary.avgTransactionValue)}
                        </p>
                      </div>
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Hourly chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    Revenue by Hour
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dailyReport.summary.totalTransactions === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <BarChart3 className="h-10 w-10 mb-2 opacity-30" />
                      <p className="text-sm">No sales on {formatDate(selectedDate)}</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={dailyReport.hourlyBreakdown.filter((h) => h.revenue > 0)}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${v}`} />
                        <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={(l) => `Hour: ${l}`} />
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Top products */}
              {dailyReport.topProducts.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Top Selling Products</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium text-gray-600">#</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-600">Product</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-600 hidden sm:table-cell">Category</th>
                          <th className="text-right px-3 py-2 font-medium text-gray-600">Qty</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-600">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {dailyReport.topProducts.map((p, i) => (
                          <tr key={p.productId} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 text-gray-400 font-medium">{i + 1}</td>
                            <td className="px-3 py-2.5 font-medium">{p.name}</td>
                            <td className="px-3 py-2.5 hidden sm:table-cell">
                              <Badge variant="secondary" className="text-xs">{p.category}</Badge>
                            </td>
                            <td className="px-3 py-2.5 text-right">{p.qty}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-blue-700">
                              {formatCurrency(p.revenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </>
      )}

      {activeTab === 'range' && (
        <>
          {/* Range selector */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setRangeDays(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${rangeDays === d ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {d} days
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={handleExportRange} className="gap-1.5 ml-auto">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : rangeReport ? (
            <>
              {/* Summary totals */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Revenue</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">
                      {formatCurrency(rangeReport.data.reduce((s, d) => s + d.revenue, 0))}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Last {rangeDays} days</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Transactions</p>
                    <p className="text-2xl font-bold text-green-700 mt-1">
                      {rangeReport.data.reduce((s, d) => s + d.transactions, 0)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Last {rangeDays} days</p>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue line chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    Revenue Trend — Last {rangeDays} Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={rangeReport.data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => {
                          const d = new Date(v);
                          return `${d.getMonth() + 1}/${d.getDate()}`;
                        }}
                      />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${v}`} />
                      <Tooltip
                        formatter={(v: number) => formatCurrency(v)}
                        labelFormatter={(l) => formatDate(l)}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name="Revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Daily breakdown table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Daily Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-gray-600">Date</th>
                        <th className="text-right px-3 py-2 font-medium text-gray-600">Transactions</th>
                        <th className="text-right px-4 py-2 font-medium text-gray-600">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[...rangeReport.data].reverse().map((d) => (
                        <tr key={d.date} className={`hover:bg-gray-50 ${d.revenue === 0 ? 'opacity-50' : ''}`}>
                          <td className="px-4 py-2.5">{formatDate(d.date)}</td>
                          <td className="px-3 py-2.5 text-right">
                            {d.transactions > 0 ? (
                              <Badge variant="secondary">{d.transactions}</Badge>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-blue-700">
                            {d.revenue > 0 ? formatCurrency(d.revenue) : <span className="text-gray-300 font-normal">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
