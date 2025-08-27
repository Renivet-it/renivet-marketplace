"use client";
// import React, { useState, useEffect, useMemo } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
//   PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid,
//   PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, FunnelChart, Funnel, LabelList
// } from "recharts";
// import {
//   ArrowUp, ArrowDown, TrendingUp, ShoppingCart, Eye, DollarSign, Calendar,
//   Users, Target, Globe, Zap, Filter, Download, RefreshCw, Moon, Sun,
//   BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
//   Settings, Bell, Search, ChevronDown, Activity, Percent, MapPin
// } from "lucide-react";
// import { Button } from "@/components/ui/button-general";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input-general";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-general";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Switch } from "@/components/ui/switch";
// import { Progress } from "@/components/ui/progress";

// Enhanced data structures with more realistic data
// const generateProducts = () => [
//   { id: "1", name: "iPhone 15 Pro Max", brand: "Apple", clicks: 15420, sales: 1890000, price: 1199, category: "Smartphones", inventory: 245, rating: 4.8, reviews: 1250 },
//   { id: "2", name: "Galaxy S24 Ultra", brand: "Samsung", clicks: 12890, sales: 1456000, price: 1299, category: "Smartphones", inventory: 189, rating: 4.7, reviews: 980 },
//   { id: "3", name: "MacBook Pro M3", brand: "Apple", clicks: 8950, sales: 2125000, price: 1999, category: "Laptops", inventory: 67, rating: 4.9, reviews: 567 },
//   { id: "4", name: "Dell XPS 15", brand: "Dell", clicks: 6720, sales: 945000, price: 1599, category: "Laptops", inventory: 123, rating: 4.5, reviews: 423 },
//   { id: "5", name: "AirPods Pro 2", brand: "Apple", clicks: 18450, sales: 695000, price: 249, category: "Audio", inventory: 456, rating: 4.6, reviews: 2100 },
//   { id: "6", name: "Surface Studio", brand: "Microsoft", clicks: 4560, sales: 1238000, price: 3499, category: "Desktops", inventory: 23, rating: 4.4, reviews: 156 },
//   { id: "7", name: "iPad Pro 12.9", brand: "Apple", clicks: 9780, sales: 1167000, price: 1099, category: "Tablets", inventory: 234, rating: 4.7, reviews: 789 },
//   { id: "8", name: "Galaxy Buds Pro", brand: "Samsung", clicks: 7890, sales: 428000, price: 199, category: "Audio", inventory: 567, rating: 4.3, reviews: 890 },
//   { id: "9", name: "ThinkPad X1 Carbon", brand: "Lenovo", clicks: 5420, sales: 832000, price: 1899, category: "Laptops", inventory: 89, rating: 4.6, reviews: 345 },
//   { id: "10", name: "Pixel 8 Pro", brand: "Google", clicks: 6380, sales: 522000, price: 999, category: "Smartphones", inventory: 178, rating: 4.5, reviews: 567 }
// ];

// const generateTimeSeriesData = () => {
//   const brands = ["Apple", "Samsung", "Dell", "Microsoft", "Lenovo", "Google"];
//   const data = [];
//   for (let i = 29; i >= 0; i--) {
//     const date = new Date();
//     date.setDate(date.getDate() - i);
//     const entry = {
//       date: date.toISOString().split("T")[0],
//       timestamp: date.getTime(),
//     };
//     brands.forEach((brand) => {
//       const baseValue = Math.random() * 50000 + 10000;
//       const trend = Math.sin((29 - i) * 0.2) * 5000;
//       entry[brand] = Math.floor(baseValue + trend + (Math.random() - 0.5) * 10000);
//     });
//     data.push(entry);
//   }
//   return data;
// };

// const generateCustomerSegments = () => [
//   { segment: "Premium", customers: 15420, revenue: 2890000, avgOrderValue: 187.5, color: "#8b5cf6" },
//   { segment: "Regular", customers: 45680, revenue: 3456000, avgOrderValue: 75.6, color: "#06b6d4" },
//   { segment: "Budget", customers: 78920, revenue: 1890000, avgOrderValue: 23.9, color: "#10b981" },
//   { segment: "New", customers: 23450, revenue: 567000, avgOrderValue: 24.2, color: "#f59e0b" }
// ];

// const generateTrafficSources = () => [
//   { source: "Organic Search", visitors: 45680, conversions: 3456, rate: 7.57, color: "#8b5cf6" },
//   { source: "Paid Ads", visitors: 23450, conversions: 2890, rate: 12.33, color: "#06b6d4" },
//   { source: "Social Media", visitors: 18920, conversions: 1234, rate: 6.52, color: "#10b981" },
//   { source: "Direct", visitors: 15670, conversions: 1890, rate: 12.06, color: "#f59e0b" },
//   { source: "Email", visitors: 8950, conversions: 1567, rate: 17.51, color: "#ef4444" }
// ];

// const generateConversionFunnel = () => [
//   { stage: "Visitors", value: 125000, color: "#8b5cf6" },
//   { stage: "Product Views", value: 89000, color: "#06b6d4" },
//   { stage: "Add to Cart", value: 34500, color: "#10b981" },
//   { stage: "Checkout", value: 18900, color: "#f59e0b" },
//   { stage: "Purchase", value: 12340, color: "#ef4444" }
// ];

// function EcommerceDashboard() {
//   const [darkMode, setDarkMode] = useState(false);
//   const [activeTab, setActiveTab] = useState("overview");
//   const [dateRange, setDateRange] = useState("30d");
//   const [selectedBrand, setSelectedBrand] = useState("all");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [isRealTime, setIsRealTime] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);

//   const products = useMemo(() => generateProducts(), []);
//   const timeSeriesData = useMemo(() => generateTimeSeriesData(), []);
//   const customerSegments = useMemo(() => generateCustomerSegments(), []);
//   const trafficSources = useMemo(() => generateTrafficSources(), []);
//   const conversionFunnel = useMemo(() => generateConversionFunnel(), []);

//   // Real-time data simulation
//   useEffect(() => {
//     if (!isRealTime) return;

//     const interval = setInterval(() => {
//       // Simulate real-time updates
//       setRefreshing(true);
//       setTimeout(() => setRefreshing(false), 1000);
//     }, 5000);

//     return () => clearInterval(interval);
//   }, [isRealTime]);

//   // Toggle dark mode
//   useEffect(() => {
//     if (darkMode) {
//       document.documentElement.classList.add("dark");
//     } else {
//       document.documentElement.classList.remove("dark");
//     }
//   }, [darkMode]);

//   // Calculate metrics
//   const metrics = useMemo(() => {
//     const filteredProducts = products.filter(p => 
//       selectedBrand === "all" || p.brand === selectedBrand
//     );
//     const totalSales = filteredProducts.reduce((sum, p) => sum + p.sales, 0);
//     const totalClicks = filteredProducts.reduce((sum, p) => sum + p.clicks, 0);
//     const avgConversion = (totalSales / 1000) / totalClicks * 100;
//     return {
//       totalSales,
//       totalClicks,
//       avgConversion,
//       totalProducts: filteredProducts.length,
//       totalCustomers: customerSegments.reduce((sum, s) => sum + s.customers, 0),
//       totalRevenue: customerSegments.reduce((sum, s) => sum + s.revenue, 0)
//     };
//   }, [products, selectedBrand, customerSegments]);

//   // Brand metrics
  // const brandMetrics = useMemo(() => {
  //   const brandMap = new Map();
  //   products.forEach(product => {
  //     const existing = brandMap.get(product.brand);
  //     if (existing) {
  //       existing.clicks += product.clicks;
  //       existing.sales += product.sales;
  //       existing.products += 1;
  //       existing.avgRating = (existing.avgRating * (existing.products - 1) + product.rating) / existing.products;
  //     } else {
  //       brandMap.set(product.brand, {
  //         brand: product.brand,
  //         clicks: product.clicks,
  //         sales: product.sales,
  //         products: 1,
  //         avgRating: product.rating
  //       });
  //     }
  //   });
  //   return Array.from(brandMap.values()).sort((a, b) => b.sales - a.sales);
  // }, [products]);

  // const formatCurrency = (value) => {
  //   return new Intl.NumberFormat("en-US", {
  //     style: "currency",
  //     currency: "USD",
  //     minimumFractionDigits: 0
  //   }).format(value);
  // };

  // const formatNumber = (value) => {
  //   return new Intl.NumberFormat("en-US").format(value);
  // };

//   const MetricCard = ({ title, value, icon: Icon, trend, color, subtitle }) => (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.3 }}
//     >
//       <Card className="relative overflow-hidden">
//         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//           <CardTitle className="text-sm font-medium">{title}</CardTitle>
//           <div className={`p-2 rounded-full ${color}`}>
//             <Icon className="w-4 h-4 text-white" />
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="text-2xl font-bold">{value}</div>
//           {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
//           {trend !== undefined && (
//             <div className={`flex items-center mt-2 text-sm ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
//               {trend >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
//               <span className="ml-1">{Math.abs(trend).toFixed(1)}%</span>
//               <span className="ml-1 text-muted-foreground">vs last period</span>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </motion.div>
//   );

//   const handleRefresh = () => {
//     setRefreshing(true);
//     setTimeout(() => setRefreshing(false), 1500);
//   };

//   return (
//     <div className="min-h-screen bg-background">
//       {/* Header */}
//       <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
//         <div className="container mx-auto px-4 py-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-4">
//               <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
//                 Advanced Dashboard
//               </h1>
//               <Badge variant="secondary" className="animate-pulse">
//                 {isRealTime ? "Live" : "Static"}
//               </Badge>
//             </div>
            
//             <div className="flex items-center space-x-4">
//               <div className="flex items-center space-x-2">
//                 <Search className="w-4 h-4 text-muted-foreground" />
//                 <Input
//                   placeholder="Search products..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-64"
//                 />
//               </div>
              
//               <Select value={dateRange} onValueChange={setDateRange}>
//                 <SelectTrigger className="w-32">
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="7d">7 days</SelectItem>
//                   <SelectItem value="30d">30 days</SelectItem>
//                   <SelectItem value="90d">90 days</SelectItem>
//                   <SelectItem value="1y">1 year</SelectItem>
//                 </SelectContent>
//               </Select>

//               <div className="flex items-center space-x-2">
//                 <span className="text-sm">Real-time</span>
//                 <Switch checked={isRealTime} onCheckedChange={setIsRealTime} />
//               </div>

//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={handleRefresh}
//                 disabled={refreshing}
//               >
//                 <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
//               </Button>

//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => setDarkMode(!darkMode)}
//               >
//                 {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
//               </Button>

//               <Button variant="outline" size="sm">
//                 <Bell className="w-4 h-4" />
//               </Button>
//             </div>
//           </div>
//         </div>
//       </header>

//       <div className="container mx-auto px-4 py-6">
//         <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
//           <TabsList className="grid w-full grid-cols-6">
//             <TabsTrigger value="overview" className="flex items-center space-x-2">
//               <BarChart3 className="w-4 h-4" />
//               <span>Overview</span>
//             </TabsTrigger>
//             <TabsTrigger value="products" className="flex items-center space-x-2">
//               <ShoppingCart className="w-4 h-4" />
//               <span>Products</span>
//             </TabsTrigger>
//             <TabsTrigger value="customers" className="flex items-center space-x-2">
//               <Users className="w-4 h-4" />
//               <span>Customers</span>
//             </TabsTrigger>
//             <TabsTrigger value="traffic" className="flex items-center space-x-2">
//               <Globe className="w-4 h-4" />
//               <span>Traffic</span>
//             </TabsTrigger>
//             <TabsTrigger value="conversion" className="flex items-center space-x-2">
//               <Target className="w-4 h-4" />
//               <span>Conversion</span>
//             </TabsTrigger>
//             <TabsTrigger value="analytics" className="flex items-center space-x-2">
//               <Activity className="w-4 h-4" />
//               <span>Analytics</span>
//             </TabsTrigger>
//           </TabsList>

//           <TabsContent value="overview" className="space-y-6">
//             {/* Key Metrics */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//               <MetricCard
//                 title="Total Revenue"
//                 value={formatCurrency(metrics.totalRevenue)}
//                 icon={DollarSign}
//                 trend={23.5}
//                 color="bg-green-500"
//                 subtitle="All time revenue"
//               />
//               <MetricCard
//                 title="Total Sales"
//                 value={formatCurrency(metrics.totalSales)}
//                 icon={TrendingUp}
//                 trend={15.2}
//                 color="bg-blue-500"
//                 subtitle="Product sales value"
//               />
//               <MetricCard
//                 title="Total Customers"
//                 value={formatNumber(metrics.totalCustomers)}
//                 icon={Users}
//                 trend={8.1}
//                 color="bg-purple-500"
//                 subtitle="Active customers"
//               />
//               <MetricCard
//                 title="Conversion Rate"
//                 value={`${metrics.avgConversion.toFixed(2)}%`}
//                 icon={Percent}
//                 trend={-2.3}
//                 color="bg-orange-500"
//                 subtitle="Click to purchase"
//               />
//             </div>

//             {/* Charts Grid */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               {/* Revenue Trend */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Revenue Trend (30 Days)</CardTitle>
//                   <CardDescription>Daily revenue by brand</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <ResponsiveContainer width="100%" height={300}>
//                     <AreaChart data={timeSeriesData.slice(-7)}>
//                       <CartesianGrid strokeDasharray="3 3" />
//                       <XAxis
//                         dataKey="date"
//                         tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
//                       />
//                       <YAxis tickFormatter={(value) => `$${(value / 1000)}k`} />
//                       <Tooltip
//                         formatter={(value, name) => [formatCurrency(Number(value)), name]}
//                         labelFormatter={(label) => new Date(label).toLocaleDateString()}
//                       />
//                       <Area type="monotone" dataKey="Apple" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
//                       <Area type="monotone" dataKey="Samsung" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
//                       <Area type="monotone" dataKey="Dell" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
//                     </AreaChart>
//                   </ResponsiveContainer>
//                 </CardContent>
//               </Card>

//               {/* Brand Performance */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Brand Performance</CardTitle>
//                   <CardDescription>Sales distribution by brand</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <ResponsiveContainer width="100%" height={300}>
//                     <PieChart>
//                       <Pie
//                         data={brandMetrics}
//                         cx="50%"
//                         cy="50%"
//                         innerRadius={60}
//                         outerRadius={120}
//                         paddingAngle={5}
//                         dataKey="sales"
//                         label={({ brand, percent }) => `${brand} ${(percent * 100).toFixed(0)}%`}
//                       >
//                         {brandMetrics.map((entry, index) => (
//                           <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 60%)`} />
//                         ))}
//                       </Pie>
//                       <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Sales"]} />
//                     </PieChart>
//                   </ResponsiveContainer>
//                 </CardContent>
//               </Card>
//             </div>

//             {/* Performance Table */}
//             <Card>
//               <CardHeader>
//                 <CardTitle>Top Performing Products</CardTitle>
//                 <CardDescription>Best selling products this period</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="overflow-x-auto">
//                   <table className="w-full">
//                     <thead>
//                       <tr className="border-b">
//                         <th className="text-left p-2">Product</th>
//                         <th className="text-left p-2">Brand</th>
//                         <th className="text-left p-2">Sales</th>
//                         <th className="text-left p-2">Rating</th>
//                         <th className="text-left p-2">Stock</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {products
//                         .sort((a, b) => b.sales - a.sales)
//                         .slice(0, 5)
//                         .map((product) => (
//                           <tr key={product.id} className="border-b hover:bg-muted/50">
//                             <td className="p-2 font-medium">{product.name}</td>
//                             <td className="p-2">
//                               <Badge variant="outline">{product.brand}</Badge>
//                             </td>
//                             <td className="p-2">{formatCurrency(product.sales)}</td>
//                             <td className="p-2">
//                               <div className="flex items-center">
//                                 <span className="mr-1">⭐</span>
//                                 {product.rating}
//                               </div>
//                             </td>
//                             <td className="p-2">
//                               <Progress value={(product.inventory / 500) * 100} className="w-20" />
//                             </td>
//                           </tr>
//                         ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </CardContent>
//             </Card>
//           </TabsContent>

          // <TabsContent value="products" className="space-y-6">
          //   <div className="flex items-center justify-between">
          //     <h2 className="text-2xl font-bold">Product Analytics</h2>
          //     <Select value={selectedBrand} onValueChange={setSelectedBrand}>
          //       <SelectTrigger className="w-48">
          //         <SelectValue placeholder="Filter by brand" />
          //       </SelectTrigger>
          //       <SelectContent>
          //         <SelectItem value="all">All Brands</SelectItem>
          //         {Array.from(new Set(products.map(p => p.brand))).map(brand => (
          //           <SelectItem key={brand} value={brand}>{brand}</SelectItem>
          //         ))}
          //       </SelectContent>
          //     </Select>
          //   </div>

          //   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          //     <Card>
          //       <CardHeader>
          //         <CardTitle>Product Clicks vs Sales</CardTitle>
          //       </CardHeader>
          //       <CardContent>
          //         <ResponsiveContainer width="100%" height={400}>
          //           <ScatterChart data={products.filter(p => selectedBrand === "all" || p.brand === selectedBrand)}>
          //             <CartesianGrid strokeDasharray="3 3" />
          //             <XAxis dataKey="clicks" name="Clicks" />
          //             <YAxis dataKey="sales" name="Sales" tickFormatter={(value) => `$${(value / 1000)}k`} />
          //             <Tooltip
          //               formatter={(value, name) => {
          //                 if (name === "Sales") return [formatCurrency(Number(value)), name];
          //                 return [formatNumber(Number(value)), name];
          //               }}
          //               labelFormatter={() => ""}
          //             />
          //             <Scatter dataKey="sales" fill="#8b5cf6" />
          //           </ScatterChart>
          //         </ResponsiveContainer>
          //       </CardContent>
          //     </Card>

          //     <Card>
          //       <CardHeader>
          //         <CardTitle>Category Performance</CardTitle>
          //       </CardHeader>
          //       <CardContent>
          //         <ResponsiveContainer width="100%" height={400}>
          //           <BarChart data={
          //             Object.entries(
          //               products.reduce((acc, p) => {
          //                 acc[p.category] = (acc[p.category] || 0) + p.sales;
          //                 return acc;
          //               }, {})
          //             ).map(([category, sales]) => ({ category, sales }))
          //           }>
          //             <CartesianGrid strokeDasharray="3 3" />
          //             <XAxis dataKey="category" />
          //             <YAxis tickFormatter={(value) => `$${(value / 1000)}k`} />
          //             <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Sales"]} />
          //             <Bar dataKey="sales" fill="#06b6d4" />
          //           </BarChart>
          //         </ResponsiveContainer>
          //       </CardContent>
          //     </Card>
          //   </div>
          // </TabsContent>

//           <TabsContent value="customers" className="space-y-6">
//             <h2 className="text-2xl font-bold">Customer Analytics</h2>
            
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Customer Segments</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <ResponsiveContainer width="100%" height={300}>
//                     <PieChart>
//                       <Pie
//                         data={customerSegments}
//                         cx="50%"
//                         cy="50%"
//                         outerRadius={100}
//                         dataKey="customers"
//                         label={({ segment, percent }) => `${segment} ${(percent * 100).toFixed(0)}%`}
//                       >
//                         {customerSegments.map((entry, index) => (
//                           <Cell key={`cell-${index}`} fill={entry.color} />
//                         ))}
//                       </Pie>
//                       <Tooltip formatter={(value) => [formatNumber(Number(value)), "Customers"]} />
//                     </PieChart>
//                   </ResponsiveContainer>
//                 </CardContent>
//               </Card>

//               <Card>
//                 <CardHeader>
//                   <CardTitle>Revenue by Segment</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <ResponsiveContainer width="100%" height={300}>
//                     <BarChart data={customerSegments}>
//                       <CartesianGrid strokeDasharray="3 3" />
//                       <XAxis dataKey="segment" />
//                       <YAxis tickFormatter={(value) => `$${(value / 1000)}k`} />
//                       <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Revenue"]} />
//                       <Bar dataKey="revenue" fill="#10b981" />
//                     </BarChart>
//                   </ResponsiveContainer>
//                 </CardContent>
//               </Card>
//             </div>
//           </TabsContent>

//           <TabsContent value="traffic" className="space-y-6">
//             <h2 className="text-2xl font-bold">Traffic Analytics</h2>
            
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Traffic Sources</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <ResponsiveContainer width="100%" height={300}>
//                     <PieChart>
//                       <Pie
//                         data={trafficSources}
//                         cx="50%"
//                         cy="50%"
//                         outerRadius={100}
//                         dataKey="visitors"
//                         label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
//                       >
//                         {trafficSources.map((entry, index) => (
//                           <Cell key={`cell-${index}`} fill={entry.color} />
//                         ))}
//                       </Pie>
//                       <Tooltip formatter={(value) => [formatNumber(Number(value)), "Visitors"]} />
//                     </PieChart>
//                   </ResponsiveContainer>
//                 </CardContent>
//               </Card>

//               <Card>
//                 <CardHeader>
//                   <CardTitle>Conversion Rates by Source</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <ResponsiveContainer width="100%" height={300}>
//                     <BarChart data={trafficSources}>
//                       <CartesianGrid strokeDasharray="3 3" />
//                       <XAxis dataKey="source" />
//                       <YAxis />
//                       <Tooltip formatter={(value) => [`${value}%`, "Conversion Rate"]} />
//                       <Bar dataKey="rate" fill="#f59e0b" />
//                     </BarChart>
//                   </ResponsiveContainer>
//                 </CardContent>
//               </Card>
//             </div>
//           </TabsContent>

//           <TabsContent value="conversion" className="space-y-6">
//             <h2 className="text-2xl font-bold">Conversion Analytics</h2>
            
//             <Card>
//               <CardHeader>
//                 <CardTitle>Sales Funnel</CardTitle>
//                 <CardDescription>Customer journey from visitor to purchase</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <ResponsiveContainer width="100%" height={400}>
//                   <FunnelChart>
//                     <Tooltip formatter={(value) => [formatNumber(Number(value)), ""]} />
//                     <Funnel
//                       dataKey="value"
//                       data={conversionFunnel}
//                       isAnimationActive
//                     >
//                       <LabelList position="center" fill="#fff" stroke="none" />
//                     </Funnel>
//                   </FunnelChart>
//                 </ResponsiveContainer>
//               </CardContent>
//             </Card>
//           </TabsContent>

//           <TabsContent value="analytics" className="space-y-6">
//             <h2 className="text-2xl font-bold">Advanced Analytics</h2>
            
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Brand Performance Radar</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <ResponsiveContainer width="100%" height={300}>
//                     <RadarChart data={brandMetrics.slice(0, 5).map(brand => ({
//                       brand: brand.brand,
//                       sales: brand.sales / 100000,
//                       clicks: brand.clicks / 1000,
//                       products: brand.products * 2,
//                       rating: brand.avgRating
//                     }))}>
//                       <PolarGrid />
//                       <PolarAngleAxis dataKey="brand" />
//                       <PolarRadiusAxis />
//                       <Radar name="Performance" dataKey="sales" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
//                       <Tooltip />
//                     </RadarChart>
//                   </ResponsiveContainer>
//                 </CardContent>
//               </Card>

//               <Card>
//                 <CardHeader>
//                   <CardTitle>Real-time Activity</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="space-y-4">
//                     {[
//                       { action: "New order placed", time: "2 minutes ago", value: "$1,299" },
//                       { action: "Product viewed", time: "5 minutes ago", value: "iPhone 15 Pro" },
//                       { action: "Cart abandoned", time: "8 minutes ago", value: "$456" },
//                       { action: "New customer signup", time: "12 minutes ago", value: "Premium" },
//                       { action: "Review submitted", time: "15 minutes ago", value: "5 stars" }
//                     ].map((activity, index) => (
//                       <motion.div
//                         key={index}
//                         initial={{ opacity: 0, x: -20 }}
//                         animate={{ opacity: 1, x: 0 }}
//                         transition={{ delay: index * 0.1 }}
//                         className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
//                       >
//                         <div>
//                           <p className="font-medium">{activity.action}</p>
//                           <p className="text-sm text-muted-foreground">{activity.time}</p>
//                         </div>
//                         <Badge variant="secondary">{activity.value}</Badge>
//                       </motion.div>
//                     ))}
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
//           </TabsContent>
//         </Tabs>
//       </div>
//     </div>
//   );
// }

// export default EcommerceDashboard;



import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, FunnelChart, Funnel, LabelList
} from "recharts";
import {
  ArrowUp, ArrowDown, TrendingUp, ShoppingCart, Eye, DollarSign, Calendar,
  Users, Target, Globe, Zap, Filter, Download, RefreshCw, Moon, Sun,
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Settings, Bell, Search, ChevronDown, Activity, Percent, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button-general";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input-general";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-general";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { getOverviewMetrics, getRevenueTrend, getBrandPerformance, getTopProducts } from "@/actions/analytics";

// Remove the static data generation functions since we'll use real data
const generateProducts = () => [
  { id: "1", name: "iPhone 15 Pro Max", brand: "Apple", clicks: 15420, sales: 1890000, price: 1199, category: "Smartphones", inventory: 245, rating: 4.8, reviews: 1250 },
  { id: "2", name: "Galaxy S24 Ultra", brand: "Samsung", clicks: 12890, sales: 1456000, price: 1299, category: "Smartphones", inventory: 189, rating: 4.7, reviews: 980 },
  { id: "3", name: "MacBook Pro M3", brand: "Apple", clicks: 8950, sales: 2125000, price: 1999, category: "Laptops", inventory: 67, rating: 4.9, reviews: 567 },
  { id: "4", name: "Dell XPS 15", brand: "Dell", clicks: 6720, sales: 945000, price: 1599, category: "Laptops", inventory: 123, rating: 4.5, reviews: 423 },
  { id: "5", name: "AirPods Pro 2", brand: "Apple", clicks: 18450, sales: 695000, price: 249, category: "Audio", inventory: 456, rating: 4.6, reviews: 2100 },
  { id: "6", name: "Surface Studio", brand: "Microsoft", clicks: 4560, sales: 1238000, price: 3499, category: "Desktops", inventory: 23, rating: 4.4, reviews: 156 },
  { id: "7", name: "iPad Pro 12.9", brand: "Apple", clicks: 9780, sales: 1167000, price: 1099, category: "Tablets", inventory: 234, rating: 4.7, reviews: 789 },
  { id: "8", name: "Galaxy Buds Pro", brand: "Samsung", clicks: 7890, sales: 428000, price: 199, category: "Audio", inventory: 567, rating: 4.3, reviews: 890 },
  { id: "9", name: "ThinkPad X1 Carbon", brand: "Lenovo", clicks: 5420, sales: 832000, price: 1899, category: "Laptops", inventory: 89, rating: 4.6, reviews: 345 },
  { id: "10", name: "Pixel 8 Pro", brand: "Google", clicks: 6380, sales: 522000, price: 999, category: "Smartphones", inventory: 178, rating: 4.5, reviews: 567 }
];

const generateTimeSeriesData = () => {
  const brands = ["Apple", "Samsung", "Dell", "Microsoft", "Lenovo", "Google"];
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const entry = {
      date: date.toISOString().split("T")[0],
      timestamp: date.getTime(),
    };
    brands.forEach((brand) => {
      const baseValue = Math.random() * 50000 + 10000;
      const trend = Math.sin((29 - i) * 0.2) * 5000;
      entry[brand] = Math.floor(baseValue + trend + (Math.random() - 0.5) * 10000);
    });
    data.push(entry);
  }
  return data;
};

const generateCustomerSegments = () => [
  { segment: "Premium", customers: 15420, revenue: 2890000, avgOrderValue: 187.5, color: "#8b5cf6" },
  { segment: "Regular", customers: 45680, revenue: 3456000, avgOrderValue: 75.6, color: "#06b6d4" },
  { segment: "Budget", customers: 78920, revenue: 1890000, avgOrderValue: 23.9, color: "#10b981" },
  { segment: "New", customers: 23450, revenue: 567000, avgOrderValue: 24.2, color: "#f59e0b" }
];

const generateTrafficSources = () => [
  { source: "Organic Search", visitors: 45680, conversions: 3456, rate: 7.57, color: "#8b5cf6" },
  { source: "Paid Ads", visitors: 23450, conversions: 2890, rate: 12.33, color: "#06b6d4" },
  { source: "Social Media", visitors: 18920, conversions: 1234, rate: 6.52, color: "#10b981" },
  { source: "Direct", visitors: 15670, conversions: 1890, rate: 12.06, color: "#f59e0b" },
  { source: "Email", visitors: 8950, conversions: 1567, rate: 17.51, color: "#ef4444" }
];

const generateConversionFunnel = () => [
  { stage: "Visitors", value: 125000, color: "#8b5cf6" },
  { stage: "Product Views", value: 89000, color: "#06b6d4" },
  { stage: "Add to Cart", value: 34500, color: "#10b981" },
  { stage: "Checkout", value: 18900, color: "#f59e0b" },
  { stage: "Purchase", value: 12340, color: "#ef4444" }
];
function EcommerceDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("30d");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRealTime, setIsRealTime] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
    const timeSeriesData = useMemo(() => generateTimeSeriesData(), []);
  const customerSegments = useMemo(() => generateCustomerSegments(), []);
  const trafficSources = useMemo(() => generateTrafficSources(), []);
  const conversionFunnel = useMemo(() => generateConversionFunnel(), []);
  // State for real data
  const [overviewData, setOverviewData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [brandData, setBrandData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const products = useMemo(() => generateProducts(), []);

  // Fetch data function
  const fetchData = async () => {
    setLoading(true);
    try {
      const [overview, revenue, brands, products] = await Promise.all([
        getOverviewMetrics(dateRange),
        getRevenueTrend(dateRange),
        getBrandPerformance(dateRange),
        getTopProducts(5, dateRange)
      ]);
  const transformedData = brands.map((item: any) => ({
          ...item,
          sales: Number(item.sales), // Convert to number
        }));
        setBrandData(transformedData);
      setOverviewData(overview);
      setRevenueData(revenue);
      setTopProducts(products);
      console.log(revenue, "revenue");
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [dateRange]);

  // Real-time data simulation
  useEffect(() => {
    if (!isRealTime) return;
    
    const interval = setInterval(() => {
      setRefreshing(true);
      fetchData().then(() => setRefreshing(false));
    }, 30000); // Refresh every 30 seconds for real-time

    return () => clearInterval(interval);
  }, [isRealTime, dateRange]);

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const brandMetrics = useMemo(() => {
    const brandMap = new Map();
    products.forEach(product => {
      const existing = brandMap.get(product.brand);
      if (existing) {
        existing.clicks += product.clicks;
        existing.sales += product.sales;
        existing.products += 1;
        existing.avgRating = (existing.avgRating * (existing.products - 1) + product.rating) / existing.products;
      } else {
        brandMap.set(product.brand, {
          brand: product.brand,
          clicks: product.clicks,
          sales: product.sales,
          products: 1,
          avgRating: product.rating
        });
      }
    });
    return Array.from(brandMap.values()).sort((a, b) => b.sales - a.sales);
  }, [products]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat("en-US").format(value);
  };
const brandKeys = revenueData.length > 0 ? Object.keys(revenueData[0]).filter((key) => key !== "date") : [];

  const MetricCard = ({ title, value, icon: Icon, trend, color, subtitle }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className={`p-2 rounded-full ${color}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
              {trend >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              <span className="ml-1">{Math.abs(trend).toFixed(1)}%</span>
              <span className="ml-1 text-muted-foreground">vs last period</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData().then(() => setRefreshing(false));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Advanced Dashboard
              </h1>
              <Badge variant="secondary" className="animate-pulse">
                {isRealTime ? "Live" : "Static"}
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                  <SelectItem value="1y">1 year</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <span className="text-sm">Real-time</span>
                <Switch checked={isRealTime} onCheckedChange={setIsRealTime} />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4" />
              <span>Products</span>
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Customers</span>
            </TabsTrigger>
            <TabsTrigger value="traffic" className="flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>Traffic</span>
            </TabsTrigger>
            <TabsTrigger value="conversion" className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Conversion</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Revenue"
                value={formatCurrency(overviewData?.totalRevenue || 0)}
                icon={DollarSign}
                trend={overviewData?.trends?.revenue || 0}
                color="bg-green-500"
                subtitle="All time revenue"
              />
              <MetricCard
                title="Total Sales"
                value={formatCurrency(overviewData?.totalSales || 0)}
                icon={TrendingUp}
                trend={overviewData?.trends?.sales || 0}
                color="bg-blue-500"
                subtitle="Product sales value"
              />
              <MetricCard
                title="Total Customers"
                value={formatNumber(overviewData?.totalCustomers || 0)}
                icon={Users}
                trend={overviewData?.trends?.customers || 0}
                color="bg-purple-500"
                subtitle="Active customers"
              />
              <MetricCard
                title="Conversion Rate"
                value={`${overviewData?.conversionRate?.toFixed(2) || 0}%`}
                icon={Percent}
                trend={overviewData?.trends?.conversion || 0}
                color="bg-orange-500"
                subtitle="Click to purchase"
              />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend */}
<Card>
  <CardHeader>
    <CardTitle>Revenue Trend</CardTitle>
    <CardDescription>Daily revenue by brand</CardDescription>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={revenueData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) =>
            new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          }
        />
        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`} />
        <Tooltip
          formatter={(value: number, name: string) => [formatCurrency(Number(value)), name]}
          labelFormatter={(label) => new Date(label).toLocaleDateString()}
        />

        {/* ✅ Dynamic Area components */}
        {brandKeys.map((brand, index) => {
          const colors = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]; // Extend as needed
          const color = colors[index % colors.length];
          return (
            <Area
              key={brand}
              type="monotone"
              dataKey={brand}
              stackId="1"
              stroke={color}
              fill={color}
              fillOpacity={0.6}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  </CardContent>
</Card>

              {/* Brand Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Brand Performance</CardTitle>
                  <CardDescription>Sales distribution by brand</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={brandData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="sales"
                        label={({ brand, percent }: any) => `${brand} ${(percent * 100).toFixed(0)}%`}
                      >
                        {brandData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 60%)`} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [formatCurrency(Number(value)), "Sales"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Performance Table */}
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Performing Products</CardTitle>
                <CardDescription>Best selling products this period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Product</th>
                        <th className="text-left p-2">Brand</th>
                        <th className="text-left p-2">Sales</th>
                        {/* <th className="text-left p-2">Rating</th>
                        <th className="text-left p-2">Stock</th> */}
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((product: any) => (
                        <tr key={product.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">{product.name}</td>
                          <td className="p-2">
                            <Badge variant="outline">{product.brand}</Badge>
                          </td>
                          <td className="p-2">{formatCurrency(product.sales)}</td>
                          {/* <td className="p-2">
                            <div className="flex items-center">
                              <span className="mr-1">⭐</span>
                              {product.rating || "N/A"}
                            </div>
                          </td>
                          <td className="p-2">
                            <Progress value={(product.inventory / 500) * 100} className="w-20" />
                          </td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs remain similar but would need similar data integration */}
   <TabsContent value="products" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Product Analytics</h2>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {Array.from(new Set(products.map(p => p.brand))).map(brand => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Clicks vs Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart data={products.filter(p => selectedBrand === "all" || p.brand === selectedBrand)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="clicks" name="Clicks" />
                      <YAxis dataKey="sales" name="Sales" tickFormatter={(value) => `$${(value / 1000)}k`} />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === "Sales") return [formatCurrency(Number(value)), name];
                          return [formatNumber(Number(value)), name];
                        }}
                        labelFormatter={() => ""}
                      />
                      <Scatter dataKey="sales" fill="#8b5cf6" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={
                      Object.entries(
                        products.reduce((acc, p) => {
                          acc[p.category] = (acc[p.category] || 0) + p.sales;
                          return acc;
                        }, {})
                      ).map(([category, sales]) => ({ category, sales }))
                    }>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000)}k`} />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Sales"]} />
                      <Bar dataKey="sales" fill="#06b6d4" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Other tabs... */}
  <TabsContent value="customers" className="space-y-6">
            <h2 className="text-2xl font-bold">Customer Analytics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Segments</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={customerSegments}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="customers"
                        label={({ segment, percent }) => `${segment} ${(percent * 100).toFixed(0)}%`}
                      >
                        {customerSegments.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [formatNumber(Number(value)), "Customers"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Segment</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={customerSegments}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="segment" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000)}k`} />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Revenue"]} />
                      <Bar dataKey="revenue" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="traffic" className="space-y-6">
            <h2 className="text-2xl font-bold">Traffic Analytics</h2>
         
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Traffic Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={trafficSources}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="visitors"
                        label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
                      >
                        {trafficSources.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [formatNumber(Number(value)), "Visitors"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Rates by Source</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={trafficSources}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="source" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}%`, "Conversion Rate"]} />
                      <Bar dataKey="rate" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="conversion" className="space-y-6">
            <h2 className="text-2xl font-bold">Conversion Analytics</h2>
         
            <Card>
              <CardHeader>
                <CardTitle>Sales Funnel</CardTitle>
                <CardDescription>Customer journey from visitor to purchase</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <FunnelChart>
                    <Tooltip formatter={(value) => [formatNumber(Number(value)), ""]} />
                    <Funnel
                      dataKey="value"
                      data={conversionFunnel}
                      isAnimationActive
                    >
                      <LabelList position="center" fill="#fff" stroke="none" />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">Advanced Analytics</h2>
         
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Brand Performance Radar</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={brandMetrics.slice(0, 5).map(brand => ({
                      brand: brand.brand,
                      sales: brand.sales / 100000,
                      clicks: brand.clicks / 1000,
                      products: brand.products * 2,
                      rating: brand.avgRating
                    }))}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="brand" />
                      <PolarRadiusAxis />
                      <Radar name="Performance" dataKey="sales" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Real-time Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: "New order placed", time: "2 minutes ago", value: "$1,299" },
                      { action: "Product viewed", time: "5 minutes ago", value: "iPhone 15 Pro" },
                      { action: "Cart abandoned", time: "8 minutes ago", value: "$456" },
                      { action: "New customer signup", time: "12 minutes ago", value: "Premium" },
                      { action: "Review submitted", time: "15 minutes ago", value: "5 stars" }
                    ].map((activity, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-muted-foreground">{activity.time}</p>
                        </div>
                        <Badge variant="secondary">{activity.value}</Badge>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default EcommerceDashboard;