"use client";
import React, { useState, useMemo, use } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from "recharts";
import { ArrowUp, ArrowDown, TrendingUp, ShoppingCart, Eye, DollarSign, Calendar } from "lucide-react";

// TypeScript interfaces
interface Product {
  id: string;
  name: string;
  brand: string;
  clicks: number;
  sales: number;
  price: number;
}

interface BrandMetrics {
  brand: string;
  clicks: number;
  sales: number;
  avgSaleValue: number;
  products: number;
}

interface TimeSeriesData {
  date: string;
  [key: string]: string | number;
}

interface SalesMetrics {
  totalSales: number;
  monthlySales: number;
  weeklySales: number;
  yearlyGrowth: number;
}

const EcommerceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "brands" | "trends">("overview");

  // Static data - in a real app, this would come from an API
  const products: Product[] = [
    { id: "1", name: "iPhone 15 Pro", brand: "Apple", clicks: 1250, sales: 89000, price: 1099 },
    { id: "2", name: "Galaxy S24", brand: "Samsung", clicks: 980, sales: 65000, price: 899 },
    { id: "3", name: "MacBook Air M3", brand: "Apple", clicks: 850, sales: 125000, price: 1299 },
    { id: "4", name: "Dell XPS 13", brand: "Dell", clicks: 620, sales: 45000, price: 999 },
    { id: "5", name: "AirPods Pro", brand: "Apple", clicks: 1450, sales: 35000, price: 249 },
    { id: "6", name: "Surface Laptop", brand: "Microsoft", clicks: 540, sales: 38000, price: 1199 },
    { id: "7", name: "iPad Pro", brand: "Apple", clicks: 780, sales: 67000, price: 799 },
    { id: "8", name: "Galaxy Buds", brand: "Samsung", clicks: 690, sales: 28000, price: 179 },
    { id: "9", name: "ThinkPad X1", brand: "Lenovo", clicks: 420, sales: 32000, price: 1399 },
    { id: "10", name: "Pixel 8", brand: "Google", clicks: 380, sales: 22000, price: 699 }
  ];

  // Generate time series data for the last 30 days
  const generateTimeSeriesData = (): TimeSeriesData[] => {
    const brands = ["Apple", "Samsung", "Dell", "Microsoft", "Lenovo", "Google"];
    const data: TimeSeriesData[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const entry: TimeSeriesData = {
        date: date.toISOString().split("T")[0],
      };
      brands.forEach((brand) => {
        entry[brand] = Math.floor(Math.random() * 5000) + 1000;
      });
      data.push(entry);
    }
    return data;
  };

  const timeSeriesData = useMemo(() => generateTimeSeriesData(), []);

  // Calculate brand metrics
  const brandMetrics: BrandMetrics[] = useMemo(() => {
    const brandMap = new Map<string, BrandMetrics>();
    products.forEach(product => {
      const existing = brandMap.get(product.brand);
      if (existing) {
        existing.clicks += product.clicks;
        existing.sales += product.sales;
        existing.products += 1;
        existing.avgSaleValue = existing.sales / existing.products;
      } else {
        brandMap.set(product.brand, {
          brand: product.brand,
          clicks: product.clicks,
          sales: product.sales,
          avgSaleValue: product.sales,
          products: 1
        });
      }
    });
    return Array.from(brandMap.values()).sort((a, b) => b.clicks - a.clicks);
  }, [products]);

  // Calculate overall metrics
  const salesMetrics: SalesMetrics = useMemo(() => {
    const totalSales = products.reduce((sum, p) => sum + p.sales, 0);
    return {
      totalSales,
      monthlySales: totalSales * 0.85, // Assuming 85% of total is monthly
      weeklySales: totalSales * 0.25,  // Assuming 25% of total is weekly
      yearlyGrowth: 23.5 // Static growth percentage
    };
  }, [products]);

  // Colors for charts
  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1", "#d084d0", "#ffb366"];

  // Utility function to format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0
    }).format(value);
  };

  // Utility function to format numbers
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  const MetricCard: React.FC<{
    title: string;
    value: string;
    icon: React.ElementType;
    trend?: number;
    color: string;
  }> = ({ title, value, icon: Icon, trend, color }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
              {trend >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              <span className="ml-1">{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Sales"
          value={formatCurrency(salesMetrics.totalSales)}
          icon={DollarSign}
          trend={salesMetrics.yearlyGrowth}
          color="bg-blue-500"
        />
        <MetricCard
          title="Monthly Sales"
          value={formatCurrency(salesMetrics.monthlySales)}
          icon={TrendingUp}
          trend={15.2}
          color="bg-green-500"
        />
        <MetricCard
          title="Weekly Sales"
          value={formatCurrency(salesMetrics.weeklySales)}
          icon={Calendar}
          trend={8.1}
          color="bg-purple-500"
        />
        <MetricCard
          title="Total Products"
          value={products.length.toString()}
          icon={ShoppingCart}
          color="bg-orange-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Brand Distribution (Clicks)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={brandMetrics}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="clicks"
                label={({ brand, percent }) => `${brand} ${(percent * 100).toFixed(0)}%`}
              >
                {brandMetrics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [formatNumber(Number(value)), "Clicks"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Sales Trend (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeriesData.slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              />
              <YAxis tickFormatter={(value) => `$${(value / 1000)}k`} />
              <Tooltip
                formatter={(value, name) => [formatCurrency(Number(value)), name]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Area
                type="monotone"
                dataKey="Apple"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="Samsung"
                stackId="1"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="Dell"
                stackId="1"
                stroke="#ffc658"
                fill="#ffc658"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Product Clicks</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={products.sort((a, b) => b.clicks - a.clicks)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={100}
              fontSize={12}
            />
            <YAxis />
            <Tooltip formatter={(value) => [formatNumber(Number(value)), "Clicks"]} />
            <Bar dataKey="clicks" fill="#8884d8">
              {products.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Product Performance Table</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTR</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products
                .sort((a, b) => b.clicks - a.clicks)
                .map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.brand}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-2 text-blue-500" />
                        {formatNumber(product.clicks)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(product.sales)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {((product.sales / product.price) / product.clicks * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderBrands = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Brand Sales Performance</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={brandMetrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="brand" />
            <YAxis yAxisId="left" orientation="left" tickFormatter={(value) => `$${(value / 1000)}k`} />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value, name) => {
                if (name === "Sales") return [formatCurrency(Number(value)), name];
                return [formatNumber(Number(value)), name];
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="sales" fill="#8884d8" name="Sales" />
            <Bar yAxisId="right" dataKey="clicks" fill="#82ca9d" name="Clicks" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Brand Analytics Table</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Clicks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Sale Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {brandMetrics.map((brand) => (
                <tr key={brand.brand} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {brand.brand}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(brand.clicks)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(brand.sales)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(brand.avgSaleValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {brand.products}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {((brand.sales / 1000) / brand.clicks * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTrends = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">30-Day Sales Trend by Brand</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            />
            <YAxis tickFormatter={(value) => `$${(value / 1000)}k`} />
            <Tooltip
              formatter={(value, name) => [formatCurrency(Number(value)), name]}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Legend />
            <Line type="monotone" dataKey="Apple" stroke="#8884d8" strokeWidth={2} />
            <Line type="monotone" dataKey="Samsung" stroke="#82ca9d" strokeWidth={2} />
            <Line type="monotone" dataKey="Dell" stroke="#ffc658" strokeWidth={2} />
            <Line type="monotone" dataKey="Microsoft" stroke="#ff7c7c" strokeWidth={2} />
            <Line type="monotone" dataKey="Lenovo" stroke="#8dd1e1" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Weekly Sales Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeSeriesData.slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { weekday: "short" })}
              />
              <YAxis tickFormatter={(value) => `$${(value / 1000)}k`} />
              <Tooltip
                formatter={(value, name) => [formatCurrency(Number(value)), name]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Bar dataKey="Apple" stackId="a" fill="#8884d8" />
              <Bar dataKey="Samsung" stackId="a" fill="#82ca9d" />
              <Bar dataKey="Dell" stackId="a" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Monthly Growth Indicators</h3>
          <div className="space-y-4">
            {brandMetrics.slice(0, 5).map((brand, index) => (
              <div key={brand.brand} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium">{brand.brand}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(brand.sales)}</div>
                  <div className="text-sm text-green-600 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +{(Math.random() * 20 + 5).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">E-commerce Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into your product performance and sales metrics</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { key: "overview", label: "Overview", icon: TrendingUp },
              { key: "products", label: "Products", icon: ShoppingCart },
              { key: "brands", label: "Brands", icon: Eye },
              { key: "trends", label: "Trends", icon: Calendar }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === "overview" && renderOverview()}
          {activeTab === "products" && renderProducts()}
          {activeTab === "brands" && renderBrands()}
          {activeTab === "trends" && renderTrends()}
        </div>
      </div>
    </div>
  );
};

export default EcommerceDashboard;