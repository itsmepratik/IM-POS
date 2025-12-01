"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Layout } from "@/components/layout";
import { lubricants, filterPricing, baseFilterPrice } from "./data";
import { useVehicleData } from "./hooks/useVehicleData";

const InternalToolPage = () => {
  const {
    makes,
    models,
    years,
    engines,
    vehicle,
    loading,
    fetchModels,
    fetchYears,
    fetchEngines,
    fetchVehicleDetails,
    setVehicle
  } = useVehicleData();

  const [selectedMake, setSelectedMake] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedEngine, setSelectedEngine] = useState<string>("");
  
  const [filterQuality, setFilterQuality] = useState<string>("none");
  const [showLubricants, setShowLubricants] = useState(false);

  const handleMakeChange = (value: string) => {
    setSelectedMake(value);
    setSelectedModel("");
    setSelectedYear("");
    setSelectedEngine("");
    setVehicle(null);
    setShowLubricants(false);
    fetchModels(value);
  };

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    setSelectedYear("");
    setSelectedEngine("");
    setVehicle(null);
    setShowLubricants(false);
    fetchYears(selectedMake, value);
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    setSelectedEngine("");
    setVehicle(null);
    setShowLubricants(false);
    fetchEngines(selectedMake, selectedModel, parseInt(value));
  };

  const handleEngineChange = (value: string) => {
    setSelectedEngine(value);
    setVehicle(null);
    setShowLubricants(false);
  };

  const handleCalculate = () => {
    if (selectedMake && selectedModel && selectedYear && selectedEngine) {
      fetchVehicleDetails(selectedMake, selectedModel, parseInt(selectedYear), selectedEngine);
      setShowLubricants(false);
    }
  };

  const handleReset = () => {
    setSelectedMake("");
    setSelectedModel("");
    setSelectedYear("");
    setSelectedEngine("");
    setVehicle(null);
    setFilterQuality("none");
    setShowLubricants(false);
  };

  return (
    <Layout>
      <div className="mx-auto max-w-4xl space-y-6 lg:space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="text-4xl font-bold text-foreground drop-shadow-md">Car Oil & Filter Lookup</h1>
          <p className="text-muted-foreground text-base">Internal tool for calculating required lubricant volumes and oil filters</p>
        </header>

        <Card className="shadow-xl border-border/50">
          <CardHeader>
            <CardTitle className="text-2xl">Vehicle Information</CardTitle>
            <CardDescription className="text-sm">Select your vehicle details to calculate oil volume and filter requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <Select value={selectedMake} onValueChange={handleMakeChange} disabled={loading && makes.length === 0}>
                  <SelectTrigger id="make">
                    <SelectValue placeholder="Select make" />
                  </SelectTrigger>
                  <SelectContent>
                    {makes.map((make) => (
                      <SelectItem key={make} value={make}>
                        {make}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select 
                  value={selectedModel} 
                  onValueChange={handleModelChange}
                  disabled={!selectedMake || (loading && models.length === 0)}
                >
                  <SelectTrigger id="model">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Select 
                  value={selectedYear} 
                  onValueChange={handleYearChange}
                  disabled={!selectedModel || (loading && years.length === 0)}
                >
                  <SelectTrigger id="year">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="engine">Engine Size</Label>
                <Select 
                  value={selectedEngine} 
                  onValueChange={handleEngineChange}
                  disabled={!selectedYear || (loading && engines.length === 0)}
                >
                  <SelectTrigger id="engine">
                    <SelectValue placeholder="Select engine" />
                  </SelectTrigger>
                  <SelectContent>
                    {engines.map((engine) => (
                      <SelectItem key={engine} value={engine}>
                        {engine}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button 
                onClick={handleCalculate} 
                disabled={!selectedEngine || loading}
                className="flex-1 text-sm"
              >
                {loading ? "Loading..." : "Calculate Oil Volume"}
              </Button>
              <Button 
                onClick={handleReset} 
                variant="outline"
                className="text-sm"
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {vehicle && (
          <Card className="shadow-xl border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl">Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 lg:space-y-8">
              {/* Oil Volume */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Required Oil Volume</h3>
                <div className="rounded-lg bg-accent/50 p-4 sm:p-6 text-center border border-border">
                  <p className="text-sm text-muted-foreground">
                    {vehicle.make} {vehicle.model} {vehicle.year} ({vehicle.engine})
                  </p>
                  <p className="mt-2 text-3xl font-bold text-primary">
                    {vehicle.oil_capacity} L
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">liters of oil required</p>
                </div>
              </div>

              {/* Oil Filter */}
              {vehicle.oil_filter_part_number && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Oil Filter</h3>
                  <div className="space-y-4">
                    <div className="rounded-lg bg-accent/50 p-4 border border-border">
                      <p className="text-sm text-muted-foreground mb-1">Part Number</p>
                      <p className="text-lg font-semibold text-foreground">{vehicle.oil_filter_part_number}</p>
                    </div>
                    
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Select Filter Quality</Label>
                      <RadioGroup value={filterQuality} onValueChange={setFilterQuality}>
                        <div className="grid gap-2 sm:gap-3">
                          {Object.entries(filterPricing).map(([key, value]) => (
                            <div key={key} className="flex items-center space-x-2 sm:space-x-3">
                              <RadioGroupItem value={key} id={key} />
                              <Label htmlFor={key} className="flex-1 cursor-pointer">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-sm">{value.label}</span>
                                  <span className="text-primary font-semibold text-sm">
                                    {key === "none" ? "$0.00" : `$${(baseFilterPrice * value.multiplier).toFixed(2)}`}
                                  </span>
                                </div>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={() => setShowLubricants(true)}
                className="w-full text-sm"
              >
                View Available Lubricants & Pricing
              </Button>

              {/* Price Breakdown - Only show when filter is not "none" */}
              {filterQuality !== "none" && showLubricants && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Price Breakdown</h3>
                  <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardContent className="pt-6 space-y-4">
                      <div className="space-y-3">
                        {lubricants.map((lubricant, index) => (
                          <div key={index} className="space-y-3">
                            <div className="flex justify-between items-center p-3 sm:p-4 rounded-lg bg-background/50">
                              <div>
                                <p className="font-medium text-sm">{lubricant.name}</p>
                                <p className="text-xs text-muted-foreground">Lubricant</p>
                              </div>
                              <p className="text-base font-semibold">
                                ${(lubricant.pricePerLiter * vehicle.oil_capacity).toFixed(2)}
                              </p>
                            </div>

                            <div className="flex justify-between items-center p-3 sm:p-4 rounded-lg bg-background/50">
                              <div>
                                <p className="font-medium text-sm">Oil Filter</p>
                                <p className="text-xs text-muted-foreground">
                                  {filterPricing[filterQuality as keyof typeof filterPricing].label}
                                </p>
                              </div>
                              <p className="text-base font-semibold">
                                ${(baseFilterPrice * filterPricing[filterQuality as keyof typeof filterPricing].multiplier).toFixed(2)}
                              </p>
                            </div>

                            <Separator />

                            <div className="flex justify-between items-center p-4 sm:p-6 rounded-lg bg-primary/20 border-2 border-primary/50">
                              <p className="text-lg font-bold">Total ({lubricant.name})</p>
                              <p className="text-2xl font-bold text-primary">
                                ${(
                                  lubricant.pricePerLiter * vehicle.oil_capacity +
                                  baseFilterPrice * filterPricing[filterQuality as keyof typeof filterPricing].multiplier
                                ).toFixed(2)}
                              </p>
                            </div>

                            {index < lubricants.length - 1 && <Separator className="my-6" />}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {showLubricants && vehicle && (
          <Card className="shadow-xl border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl">Available Lubricants</CardTitle>
              <CardDescription className="text-sm">Pricing based on {vehicle.oil_capacity}L oil volume requirement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                {lubricants.map((lubricant, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3 sm:p-4">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground text-sm">{lubricant.name}</p>
                        <p className="text-xs text-muted-foreground">{lubricant.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-base sm:text-lg font-semibold text-foreground">
                          ${(lubricant.pricePerLiter * vehicle.oil_capacity).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${lubricant.pricePerLiter}/L
                        </p>
                      </div>
                    </div>
                    {index < lubricants.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default InternalToolPage;
