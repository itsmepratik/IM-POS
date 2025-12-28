"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout";
import { useVehicleData } from "./hooks/useVehicleData";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ImageIcon } from "lucide-react";

const InternalToolPage = () => {
  const {
    makes,
    models,
    years,
    engines,
    vehicle,
    lubricants,
    filterProduct,
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
  
  const [showLubricants, setShowLubricants] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  // Sorting and Filtering State
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc">("price-asc");
  const [fuelType, setFuelType] = useState<"all" | "petrol" | "diesel">("all");

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
    setShowLubricants(false);
    setFuelType("all");
    setSortBy("price-asc");
  };

  const isFilterAvailable = filterProduct?.isAvailable && filterProduct.stock > 0;

  const renderThumbnail = (imageUrl: string | null, alt: string) => (
    <div 
      className="relative h-16 w-16 min-w-[4rem] overflow-hidden rounded-md border border-border bg-background cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all shadow-sm"
      onClick={() => imageUrl && setEnlargedImage(imageUrl)}
    >
      {imageUrl ? (
        <Image 
          src={imageUrl} 
          alt={alt} 
          fill 
          className="object-contain p-1" 
          sizes="64px"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted/30">
          <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
        </div>
      )}
    </div>
  );

  const filteredAndSortedLubricants = lubricants
    .filter((lubricant) => {
      if (fuelType === "all") return true;
      
      // Safely handle potential non-string values or nulls
      const spec = String(lubricant.specification || "").toLowerCase();
      
      if (fuelType === "petrol") {
        return spec.includes("petrol") || spec.includes("gasoline");
      }
      if (fuelType === "diesel") {
        return spec.includes("diesel");
      }
      return true;
    })
    .sort((a, b) => {
      const priceA = a.pricePerLiter * (vehicle?.oil_capacity || 0);
      const priceB = b.pricePerLiter * (vehicle?.oil_capacity || 0);
      return sortBy === "price-asc" ? priceA - priceB : priceB - priceA;
    });

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
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-1">Part Number</p>
                          <p className="text-lg font-semibold text-foreground">{vehicle.oil_filter_part_number}</p>
                        </div>
                        {filterProduct ? (
                          <>
                            {filterProduct.imageUrl && (
                              <div className="hidden sm:block">
                                {renderThumbnail(filterProduct.imageUrl, filterProduct.name)}
                              </div>
                            )}
                            <div className="text-right">
                               {filterProduct.isAvailable ? (
                                  <>
                                    <p className="text-xl font-bold text-primary">OMR {filterProduct.price.toFixed(2)}</p>
                                    {filterProduct.stock > 0 ? (
                                      <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800 hover:bg-green-100">
                                        In Stock ({filterProduct.stock})
                                      </Badge>
                                    ) : (
                                      <Badge variant="destructive" className="mt-1">
                                        Out of Stock
                                      </Badge>
                                    )}
                                  </>
                               ) : (
                                <Badge variant="outline" className="mt-1 border-destructive text-destructive">
                                  Part Not in Database
                                </Badge>
                               )}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground">Checking availability...</div>
                        )}
                      </div>
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
            </CardContent>
          </Card>
        )}

        {/* Lubricant Options Section - Controls and Lists */}
        {showLubricants && vehicle && (
          <Card className="shadow-xl border-border/50 animate-in fade-in slide-in-from-top-4 duration-500">
            <CardHeader>
              <CardTitle className="text-2xl">Lubricant Options</CardTitle>
              <CardDescription className="text-sm">
                {isFilterAvailable 
                  ? "Select a lubricant to see the total price with oil filter" 
                  : `Pricing based on ${vehicle.oil_capacity}L oil volume requirement`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               {/* Controls */}
               <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/20 p-4 rounded-lg border border-border/50">
                 <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Fuel Type:</span>
                    <div className="flex p-1 bg-muted rounded-lg border border-border">
                      <button
                        onClick={() => setFuelType("all")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          fuelType === "all" 
                            ? "bg-background text-foreground shadow-sm" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setFuelType("petrol")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          fuelType === "petrol" 
                            ? "bg-background text-foreground shadow-sm" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Petrol
                      </button>
                      <button
                        onClick={() => setFuelType("diesel")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          fuelType === "diesel" 
                            ? "bg-background text-foreground shadow-sm" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Diesel
                      </button>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Sort Price:</span>
                    <Select 
                      value={sortBy} 
                      onValueChange={(val: "price-asc" | "price-desc") => setSortBy(val)}
                    >
                      <SelectTrigger className="w-[160px] h-9 text-xs">
                         <SelectValue placeholder="Sort by price" />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="price-asc">Lowest to Highest</SelectItem>
                         <SelectItem value="price-desc">Highest to Lowest</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
               </div>

               {/* Pricing Lists using filteredAndSortedLubricants */}
               {isFilterAvailable && filterProduct ? (
                  <div className="space-y-3">
                    {filteredAndSortedLubricants.length > 0 ? (
                      filteredAndSortedLubricants.map((lubricant, index) => (
                        <div key={index} className="space-y-3">
                          <div className="flex justify-between items-center p-3 sm:p-4 rounded-lg bg-background/50 gap-4">
                            <div className="flex items-center gap-4 flex-1">
                              {renderThumbnail(lubricant.imageUrl, lubricant.name)}
                              <div>
                                <p className="font-bold text-sm text-primary">{lubricant.brand}</p>
                                <p className="font-medium text-sm">{lubricant.name}</p>
                                <div className="flex gap-2 text-xs text-muted-foreground">
                                   <span>{lubricant.type}</span>
                                   {lubricant.specification && (
                                      <>
                                        <span>•</span>
                                        <span>{lubricant.specification}</span>
                                      </>
                                   )}
                                </div>
                              </div>
                            </div>
                            <p className="text-base font-semibold whitespace-nowrap">
                              OMR {(lubricant.pricePerLiter * vehicle.oil_capacity).toFixed(2)}
                            </p>
                          </div>

                          <div className="flex justify-between items-center p-3 sm:p-4 rounded-lg bg-background/50 gap-4">
                            <div className="flex items-center gap-4 flex-1">
                              {renderThumbnail(filterProduct.imageUrl, filterProduct.name)}
                              <div>
                                <p className="font-medium text-sm">Oil Filter ({filterProduct.name})</p>
                              </div>
                            </div>
                            <p className="text-base font-semibold whitespace-nowrap">
                              OMR {filterProduct.price.toFixed(2)}
                            </p>
                          </div>

                          <Separator />

                          <div className="flex justify-between items-center p-4 sm:p-6 rounded-lg bg-primary/20 border-2 border-primary/50">
                            <p className="text-lg font-bold">Total</p>
                            <p className="text-2xl font-bold text-primary">
                              OMR {(
                                lubricant.pricePerLiter * vehicle.oil_capacity +
                                filterProduct.price
                              ).toFixed(2)}
                            </p>
                          </div>

                          {index < filteredAndSortedLubricants.length - 1 && <Separator className="my-6" />}
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No lubricants match the selected filters.</p>
                    )}
                  </div>
               ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {filteredAndSortedLubricants.length > 0 ? (
                      filteredAndSortedLubricants.map((lubricant, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3 sm:p-4 gap-4">
                            <div className="flex items-center gap-4 flex-1">
                               {renderThumbnail(lubricant.imageUrl, lubricant.name)}
                               <div className="space-y-1">
                                 <p className="font-bold text-primary text-base">{lubricant.brand}</p>
                                 <p className="font-medium text-foreground text-sm">{lubricant.name}</p>
                                 <div className="flex gap-2 text-xs text-muted-foreground">
                                     <span>{lubricant.type}</span>
                                     {lubricant.specification && (
                                        <>
                                          <span>•</span>
                                          <span>{lubricant.specification}</span>
                                        </>
                                     )}
                                  </div>
                               </div>
                            </div>
                            <div className="text-right whitespace-nowrap">
                              <p className="text-base sm:text-lg font-semibold text-foreground">
                                OMR {(lubricant.pricePerLiter * vehicle.oil_capacity).toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                OMR {lubricant.pricePerLiter}/L
                              </p>
                            </div>
                          </div>
                          {index < filteredAndSortedLubricants.length - 1 && <Separator className="my-2" />}
                        </div>
                      ))
                    ) : (
                       <p className="text-center text-muted-foreground py-4">No lubricants match the selected filters.</p>
                    )}
                  </div>
               )}
            </CardContent>
          </Card>
        )}

        <Dialog open={!!enlargedImage} onOpenChange={(open) => !open && setEnlargedImage(null)}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 border-none bg-transparent shadow-none [&>button]:hidden">
             <div className="relative w-full h-[80vh] flex items-center justify-center pointer-events-none">
                <div className="relative w-full h-full pointer-events-auto">
                  {enlargedImage && (
                    <Image
                      src={enlargedImage}
                      alt="Enlarged view"
                      fill
                      className="object-contain"
                      sizes="90vw"
                      quality={100}
                    />
                  )}
                </div>
               <Button 
                 className="absolute -top-12 -right-4 sm:-right-12 rounded-full h-10 w-10 bg-white/20 hover:bg-white/40 text-white backdrop-blur-md border border-white/30 z-50 pointer-events-auto transition-colors"
                 size="icon"
                 onClick={() => setEnlargedImage(null)}
               >
                 <X className="h-6 w-6" />
                 <span className="sr-only">Close</span>
               </Button>
             </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default InternalToolPage;
