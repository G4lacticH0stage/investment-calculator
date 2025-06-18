import React, { useState, useEffect } from 'react';
import { Home, Building2, Calculator, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

const Investment = () => {
  const [propertyType, setPropertyType] = useState('single');
  const [isFHA, setIsFHA] = useState(false);
  const [units, setUnits] = useState(1);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [unitRents, setUnitRents] = useState({});
  const [loanDuration, setLoanDuration] = useState('30');
  const [monthlyUtilities, setMonthlyUtilities] = useState('');
  const [landscaping, setLandscaping] = useState('');
  const [vacancyRate, setVacancyRate] = useState('');
  const [managementRate, setManagementRate] = useState('');
  const [maintenanceRate, setMaintenanceRate] = useState('');
  const [customDownPayment, setCustomDownPayment] = useState('');
  const [useCustomDownPayment, setUseCustomDownPayment] = useState(false);
  const [customInterestRate, setCustomInterestRate] = useState('');
  const [useCustomInterestRate, setUseCustomInterestRate] = useState(false);
  const [customPropertyTax, setCustomPropertyTax] = useState('');
  const [useCustomPropertyTax, setUseCustomPropertyTax] = useState(false);
  const [customMIP, setCustomMIP] = useState('');
  const [useCustomMIP, setUseCustomMIP] = useState(false);
  
  const getInterestRate = () => {
    if (useCustomInterestRate && customInterestRate) {
      return parseFloat(customInterestRate);
    }
    return 6.85;
  };
  const propertyTaxRate = 1.5;
  const homeInsurance = purchasePrice * 0.0082;
  const closingCostRate = 5;
  const mipUpfrontRate = 1.75; // Upfront MIP rate
  const pmiRate = 0.5; // Conventional PMI rate
  
  const getMIPRate = () => {
    return 0.4; // Default MIP rate for calculation
  };
  
  const getDownPaymentRate = () => {
    if (useCustomDownPayment && customDownPayment) {
      return parseFloat(customDownPayment);
    }
    if (propertyType === 'multi' && isFHA) return 3.5;
    if (propertyType === 'single') return 20;
    return 25;
  };
  
  const [results, setResults] = useState(null);
  
  useEffect(() => {
    if (propertyType === 'single') {
      setUnits(1);
      setUnitRents({ 1: unitRents[1] || '' });
      setIsFHA(false); // Reset FHA when switching to single family
    } else if (propertyType === 'multi') {
      setUnits(2); // Set to 2 units for multi-family
      // Initialize rent fields for 2 units if they don't exist
      const newUnitRents = { ...unitRents };
      for (let i = 1; i <= 2; i++) {
        if (!newUnitRents[i]) {
          newUnitRents[i] = '';
        }
      }
      setUnitRents(newUnitRents);
    }
  }, [propertyType]);
  
  const calculateMortgage = () => {
    const price = parseFloat(purchasePrice) || 0;
    const downPaymentRate = getDownPaymentRate();
    const downPayment = price * (downPaymentRate / 100);
    const loanAmount = price - downPayment;
    
    // Calculate closing costs including upfront MIP for FHA loans
    let closingCosts = price * (closingCostRate / 100);
    let upfrontMIP = 0;
    
    // FHA loan detection: explicit FHA checkbox OR 3.5% down payment
    const isFHALoan = isFHA || downPaymentRate === 3.5;
    
    if (isFHALoan) {
      upfrontMIP = loanAmount * (mipUpfrontRate / 100);
      closingCosts += upfrontMIP;
    }
    
    const totalCashNeeded = downPayment + closingCosts;
    
    const interestRate = getInterestRate();
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = parseInt(loanDuration) * 12;
    
    let monthlyPayment = 0;
    if (monthlyRate > 0) {
      monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                       (Math.pow(1 + monthlyRate, numPayments) - 1);
    }
    
    // Property tax calculation - custom or default
    let propertyTax;
    if (useCustomPropertyTax && customPropertyTax) {
      propertyTax = parseFloat(customPropertyTax) / 12; // Convert annual to monthly
    } else {
      propertyTax = (price * propertyTaxRate / 100) / 12; // Default calculation
    }
    
    const monthlyInsurance = homeInsurance / 12;
    let monthlyMIP = 0;
    let monthlyPMI = 0;
    
    // FHA MIP for any property type with FHA loan (explicit checkbox or 3.5% down)
    if (isFHALoan) {
      if (useCustomMIP && customMIP) {
        monthlyMIP = parseFloat(customMIP);
      } else {
        const mipRate = getMIPRate();
        monthlyMIP = (loanAmount * mipRate / 100) / 12;
      }
    }
    
    // PMI for conventional loans with less than 20% down (but not FHA)
    if (!isFHALoan && downPaymentRate < 20) {
      monthlyPMI = (loanAmount * pmiRate / 100) / 12;
    }
    
    const totalMonthlyPayment = monthlyPayment + propertyTax + monthlyInsurance + monthlyMIP + monthlyPMI;
    
    const totalRent = Object.values(unitRents).reduce((sum, rent) => sum + (parseFloat(rent) || 0), 0);
    const vacancyExpense = totalRent * ((parseFloat(vacancyRate) || 0) / 100);
    const effectiveRent = totalRent - vacancyExpense;
    const monthlyManagement = effectiveRent * ((parseFloat(managementRate) || 0) / 100);
    const monthlyMaintenance = effectiveRent * ((parseFloat(maintenanceRate) || 0) / 100);
    const monthlyLandscaping = (parseFloat(landscaping) || 0) / 12;
    
    const totalExpenses = totalMonthlyPayment + monthlyManagement + 
                         monthlyMaintenance + monthlyLandscaping + (parseFloat(monthlyUtilities) || 0) + vacancyExpense;
    
    const monthlyCashFlow = totalRent - totalExpenses;
    const yearlyCashFlow = monthlyCashFlow * 12;
    const cashOnCashReturn = totalCashNeeded > 0 ? (yearlyCashFlow / totalCashNeeded) * 100 : 0;
    
    // Calculate when PMI/MIP can be removed (22% equity)
    const targetEquity = 0.22;
    const targetLoanBalance = price * (1 - targetEquity); // 78% of original value
    const initialLoanBalance = loanAmount;
    const principalNeeded = initialLoanBalance - targetLoanBalance;
    
    // Calculate monthly principal payment (simplified)
    const totalInterestPaid = (monthlyPayment * numPayments) - loanAmount;
    const avgMonthlyPrincipal = loanAmount / numPayments; // Simplified calculation
    
    let paymentsToRemovePMI = 0;
    if (monthlyPMI > 0) {
      paymentsToRemovePMI = Math.ceil(principalNeeded / avgMonthlyPrincipal);
    }
    
    setResults({
      downPayment,
      closingCosts,
      upfrontMIP,
      isFHALoan,
      mipRate: getMIPRate(),
      totalCashNeeded,
      monthlyPayment: totalMonthlyPayment,
      monthlyRent: totalRent,
      effectiveRent,
      vacancyExpense,
      monthlyCashFlow,
      yearlyCashFlow,
      cashOnCashReturn,
      principalPayment: monthlyPayment,
      propertyTax,
      insurance: monthlyInsurance,
      mip: monthlyMIP,
      pmi: monthlyPMI,
      management: monthlyManagement,
      maintenance: monthlyMaintenance,
      landscapingExpense: monthlyLandscaping,
      utilities: parseFloat(monthlyUtilities) || 0,
      totalExpenses,
      paymentsToRemovePMI,
      downPaymentRate,
      interestRate
    });
  };
  
  useEffect(() => {
    calculateMortgage();
  }, [purchasePrice, propertyType, isFHA, unitRents, loanDuration, monthlyUtilities, 
      landscaping, vacancyRate, managementRate, maintenanceRate, customDownPayment, useCustomDownPayment, customInterestRate, useCustomInterestRate, customPropertyTax, useCustomPropertyTax, customMIP, useCustomMIP]);
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
            <Calculator className="text-blue-600" size={32} />
            Real Estate Investment Calculator
          </h1>
          
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Property Type</h2>
              <div className="flex gap-4">
                <button
                  onClick={() => setPropertyType('single')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${
                    propertyType === 'single' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Home size={20} />
                  Single Family
                </button>
                <button
                  onClick={() => setPropertyType('multi')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${
                    propertyType === 'multi' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Building2 size={20} />
                  Multi-Family
                </button>
              </div>
              
              {propertyType === 'multi' && (
                <div className="mt-4">
                  <label className="flex items-center gap-2 text-gray-700">
                    <input
                      type="checkbox"
                      checked={isFHA}
                      onChange={(e) => setIsFHA(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    FHA Loan (3.5% down payment)
                  </label>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Purchase Price
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="450,000"
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {propertyType === 'multi' && (
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Number of Units
                  </label>
                  <select
                    value={units}
                    onChange={(e) => setUnits(parseInt(e.target.value))}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {[2, 3, 4].map(num => (
                      <option key={num} value={num}>{num} units</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Loan Duration
                </label>
                <select
                  value={loanDuration}
                  onChange={(e) => setLoanDuration(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="15">15 years</option>
                  <option value="30">30 years</option>
                </select>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Down Payment</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-gray-700">
                  <input
                    type="checkbox"
                    checked={useCustomDownPayment}
                    onChange={(e) => setUseCustomDownPayment(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  Use custom down payment percentage
                </label>
                
                {useCustomDownPayment && (
                  <div className="max-w-xs">
                    <label className="block text-gray-700 mb-2">Down Payment (%)</label>
                    <input
                      type="number"
                      value={customDownPayment}
                      onChange={(e) => setCustomDownPayment(e.target.value)}
                      placeholder="20"
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
                
                {!useCustomDownPayment && (
                  <div className="text-sm text-gray-600">
                    Using default: {propertyType === 'single' ? '20%' : (isFHA ? '3.5% (FHA)' : '25%')} down payment
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">MIP (FHA Loans)</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-gray-700">
                  <input
                    type="checkbox"
                    checked={useCustomMIP}
                    onChange={(e) => setUseCustomMIP(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  Use custom MIP amount
                </label>
                
                {useCustomMIP && (
                  <div className="max-w-xs">
                    <label className="block text-gray-700 mb-2">Monthly MIP Amount</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 text-gray-400" size={20} />
                      <input
                        type="number"
                        value={customMIP}
                        onChange={(e) => setCustomMIP(e.target.value)}
                        placeholder="0"
                        min="0"
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
                
                {!useCustomMIP && (
                  <div className="text-sm text-gray-600">
                    Using default: 0.4% of loan amount annually
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Interest Rate</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-gray-700">
                  <input
                    type="checkbox"
                    checked={useCustomInterestRate}
                    onChange={(e) => setUseCustomInterestRate(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  Use custom interest rate
                </label>
                
                {useCustomInterestRate && (
                  <div className="max-w-xs">
                    <label className="block text-gray-700 mb-2">Interest Rate (%)</label>
                    <input
                      type="number"
                      value={customInterestRate}
                      onChange={(e) => setCustomInterestRate(e.target.value)}
                      placeholder="6.85"
                      min="0"
                      max="30"
                      step="0.01"
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
                
                {!useCustomInterestRate && (
                  <div className="text-sm text-gray-600">
                    Using default: 6.85% interest rate
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Property Tax</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-gray-700">
                  <input
                    type="checkbox"
                    checked={useCustomPropertyTax}
                    onChange={(e) => setUseCustomPropertyTax(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  Use custom property tax amount
                </label>
                
                {useCustomPropertyTax && (
                  <div className="max-w-xs">
                    <label className="block text-gray-700 mb-2">Annual Property Tax</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 text-gray-400" size={20} />
                      <input
                        type="number"
                        value={customPropertyTax}
                        onChange={(e) => setCustomPropertyTax(e.target.value)}
                        placeholder="6,750"
                        min="0"
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
                
                {!useCustomPropertyTax && (
                  <div className="text-sm text-gray-600">
                    Using default: 1.5% of purchase price annually
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Monthly Rent per Unit</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: units }, (_, i) => (
                  <div key={i}>
                    <label className="block text-gray-700 mb-2">
                      Unit {i + 1}
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 text-gray-400" size={20} />
                      <input
                        type="number"
                        value={unitRents[i + 1] || ''}
                        onChange={(e) => setUnitRents({ ...unitRents, [i + 1]: e.target.value })}
                        placeholder="2,000"
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Expenses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">Monthly Utilities</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="number"
                      value={monthlyUtilities}
                      onChange={(e) => setMonthlyUtilities(e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">Annual Landscaping</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="number"
                      value={landscaping}
                      onChange={(e) => setLandscaping(e.target.value)}
                      placeholder="1200"
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Rates and Percentages of Rent</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">Vacancy (%)</label>
                  <input
                    type="number"
                    value={vacancyRate}
                    onChange={(e) => setVacancyRate(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">Management (%)</label>
                  <input
                    type="number"
                    value={managementRate}
                    onChange={(e) => setManagementRate(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Maintenance (%)</label>
                  <input
                    type="number"
                    value={maintenanceRate}
                    onChange={(e) => setMaintenanceRate(e.target.value)}
                    placeholder="5"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            {results && purchasePrice && (
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <TrendingUp className="text-green-600" size={24} />
                  Investment Analysis
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-600">Total Cash Needed</p>
                      <p className="text-2xl font-bold text-gray-800">{formatCurrency(results.totalCashNeeded)}</p>
                      <p className="text-sm text-gray-500">
                        Down Payment ({results.downPaymentRate.toFixed(1)}%): {formatCurrency(results.downPayment)} + Closing Costs: {formatCurrency(results.closingCosts)}{results.upfrontMIP > 0 ? ` (includes ${formatCurrency(results.upfrontMIP)} upfront MIP)` : ''} | Interest Rate: {results.interestRate.toFixed(2)}%
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-gray-600">Monthly Rental Income</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(results.monthlyRent)}</p>
                      <p className="text-sm text-gray-500">Gross rental income</p>
                    </div>
                    
                    <div>
                      <p className="text-gray-600">Total Monthly Expenses</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(results.totalExpenses)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-600">Monthly Cash Flow</p>
                      <p className={`text-2xl font-bold ${results.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(results.monthlyCashFlow)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-gray-600">Yearly Cash Flow</p>
                      <p className={`text-2xl font-bold ${results.yearlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(results.yearlyCashFlow)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-gray-600">Cash-on-Cash Return</p>
                      <p className={`text-2xl font-bold ${results.cashOnCashReturn >= 8 ? 'text-green-600' : 'text-orange-500'}`}>
                        {results.cashOnCashReturn.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-white rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">Monthly Expense Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mortgage Payment (P&I)</span>
                      <span className="font-medium">{formatCurrency(results.principalPayment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Property Tax</span>
                      <span className="font-medium">{formatCurrency(results.propertyTax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Home Insurance</span>
                      <span className="font-medium">{formatCurrency(results.insurance)}</span>
                    </div>
                    {results.vacancyExpense > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vacancy ({parseFloat(vacancyRate) || 0}%)</span>
                        <span className="font-medium">{formatCurrency(results.vacancyExpense)}</span>
                      </div>
                    )}
                    {results.mip > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">MIP</span>
                        <span className="font-medium">{formatCurrency(results.mip)}</span>
                      </div>
                    )}
                    {results.pmi > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">PMI</span>
                        <span className="font-medium">
                          {formatCurrency(results.pmi)}
                          <span className="text-xs text-gray-500 ml-2">
                            (removable after {results.paymentsToRemovePMI} payments)
                          </span>
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Property Management</span>
                      <span className="font-medium">{formatCurrency(results.management)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Maintenance ({parseFloat(maintenanceRate) || 0}% of rent)</span>
                      <span className="font-medium">{formatCurrency(results.maintenance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Landscaping</span>
                      <span className="font-medium">{formatCurrency(results.landscapingExpense)}</span>
                    </div>
                    {results.utilities > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly Utilities</span>
                        <span className="font-medium">{formatCurrency(results.utilities)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {results && results.isFHALoan && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-yellow-600 mt-1" size={20} />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">FHA Loan Detected</p>
                  <p>Based on your {isFHA ? 'FHA loan selection' : '3.5% down payment'}, this is treated as an FHA loan. You'll need to pay:</p>
                  <ul className="mt-2 ml-4 list-disc">
                    <li>Upfront MIP: 1.75% of loan amount ({results ? formatCurrency(results.upfrontMIP) : '$0'}) added to closing costs</li>
                    <li>Monthly MIP: {results ? formatCurrency(results.mip) : '$0'}/month{!useCustomMIP && ' (0.4% of loan amount annually)'}</li>
                  </ul>
                </div>
              </div>
            )}
            
            {!isFHA && results && results.pmi > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-blue-600 mt-1" size={20} />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">PMI Information</p>
                  <p>With less than 20% down payment, you'll need to pay Private Mortgage Insurance (PMI) of 0.5% annually, which adds {formatCurrency(results.pmi)} to your monthly payment.</p>
                  <p className="mt-2 font-medium">Good news: PMI can be removed after {results.paymentsToRemovePMI} payments (approximately {Math.round(results.paymentsToRemovePMI / 12)} years) when you reach 22% equity in the home.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Investment;