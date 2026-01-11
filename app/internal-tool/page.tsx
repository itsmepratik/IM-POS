"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout";
import { useVehicleData } from "./hooks/useVehicleData";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ImageIcon, Filter, Droplets } from "lucide-react";

const InternalToolPage = () => {
  const {
    makes,
    models,
    years,
    engines,
    vehicle,
    lubricants,
    filterProducts,
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

  // Filter Selection State
  const [selectedFilterSpec, setSelectedFilterSpec] = useState<string>("");

  // Sorting and Filtering State
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc">("price-asc");
  const [fuelType, setFuelType] = useState<"all" | "petrol" | "diesel">("all");

  // Set default filter spec when products load
  useEffect(() => {
    if (filterProducts && filterProducts.length > 0) {
      // Prioritize "OEM" or "First Copy" if available, otherwise first.
      // Or just default to the first one available.
      // Let's try to be smart: if currently selected spec exists in new list, keep it.
      // Else, defaulting to the first one.
      const currentExists = filterProducts.some(p => (p.specification || "Standard") === selectedFilterSpec);
      if (!currentExists) {
         setSelectedFilterSpec(filterProducts[0].specification || "Standard");
      }
    } else {
      setSelectedFilterSpec("");
    }
  }, [filterProducts]);

  const selectedFilterProduct = useMemo(() => {
    if (!filterProducts || filterProducts.length === 0) return null;
    return filterProducts.find(p => (p.specification || "Standard") === selectedFilterSpec) || filterProducts[0];
  }, [filterProducts, selectedFilterSpec]);


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

  const renderThumbnail = (imageUrl: string | null, alt: string) => (
    <div 
      className="relative h-20 w-20 min-w-[5rem] overflow-hidden rounded-md border border-border bg-background cursor-pointer hover:opacity-90 transition-all"
      onClick={() => imageUrl && setEnlargedImage(imageUrl)}
    >
      {imageUrl ? (
        <Image 
          src={imageUrl} 
          alt={alt} 
          fill 
          className="object-contain p-1" 
          sizes="80px"
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
      <div className="w-full px-4 py-6 space-y-6">
        <header className="space-y-1 mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Car Oil & Filter Lookup</h1>
          <p className="text-muted-foreground text-sm">Calculate required lubricant volumes and check filter availability.</p>
        </header>

        {/* Vehicle Selection - Full Width Row */}
        <div className="grid gap-6">
          <Card className="border shadow-sm bg-card/50">
             <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="make" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Make</Label>
                  <Select value={selectedMake} onValueChange={handleMakeChange} disabled={loading && makes.length === 0}>
                    <SelectTrigger id="make" className="h-10 bg-background">
                      <SelectValue placeholder="Select Make" />
                    </SelectTrigger>
                    <SelectContent>
                      {makes.map((make) => (
                        <SelectItem key={make} value={make}>{make}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Model</Label>
                  <Select 
                    value={selectedModel} 
                    onValueChange={handleModelChange}
                    disabled={!selectedMake || (loading && models.length === 0)}
                  >
                    <SelectTrigger id="model" className="h-10 bg-background">
                      <SelectValue placeholder="Select Model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Year</Label>
                  <Select 
                    value={selectedYear} 
                    onValueChange={handleYearChange}
                    disabled={!selectedModel || (loading && years.length === 0)}
                  >
                    <SelectTrigger id="year" className="h-10 bg-background">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="engine" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Engine</Label>
                  <Select 
                    value={selectedEngine} 
                    onValueChange={handleEngineChange}
                    disabled={!selectedYear || (loading && engines.length === 0)}
                  >
                    <SelectTrigger id="engine" className="h-10 bg-background">
                      <SelectValue placeholder="Select Engine" />
                    </SelectTrigger>
                    <SelectContent>
                      {engines.map((engine) => (
                        <SelectItem key={engine} value={engine}>{engine}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                   <Button 
                    onClick={handleCalculate} 
                    disabled={!selectedEngine || loading}
                    className="flex-1 h-10 font-semibold"
                  >
                    {loading ? "Searching..." : "Lookup"}
                  </Button>
                  <Button 
                    onClick={handleReset} 
                    variant="secondary"
                    className="h-10 px-4"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {vehicle && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
               {/* Results Section */}
               <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
                 {/* Oil Filter Card */}
                 <div className="bg-card border shadow-sm rounded-xl p-0 overflow-hidden">
                    <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                       <h3 className="font-semibold flex items-center gap-2">
                         <Filter className="w-4 h-4 text-primary" />
                         Oil Filter
                       </h3>
                       {vehicle.oil_filter_part_number && (
                         <Badge variant="outline" className="font-mono text-xs">
                            {vehicle.oil_filter_part_number}
                         </Badge>
                       )}
                    </div>
                    <div className="p-6">
                      {vehicle.oil_filter_part_number ? (
                         <div className="flex flex-col md:flex-row gap-6">
                           {/* Filter Specs Selector */}
                           <div className="flex-1 space-y-4">
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Specification</Label>
                                {filterProducts.length > 0 ? (
                                  <Select 
                                    value={selectedFilterSpec} 
                                    onValueChange={setSelectedFilterSpec}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select brand/spec" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {filterProducts.map((p) => {
                                        const specLabel = p.specification || "Standard";
                                        const brandLabel = p.brand ? ` (${p.brand})` : "";
                                        return (
                                          <SelectItem key={p.id} value={specLabel}>
                                            {specLabel}{brandLabel}
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <div className="h-10 flex items-center justify-start text-sm text-destructive font-medium border border-destructive/20 bg-destructive/5 rounded-md px-3">
                                    Part Not in Database
                                  </div>
                                )}
                              </div>
                              
                              {selectedFilterProduct && (
                                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                   <span>Part Name:</span>
                                   <span className="font-medium text-foreground">{selectedFilterProduct.name}</span>
                                 </div>
                              )}
                           </div>
                            
                            {/* Filter Status/Price */}
                            {selectedFilterProduct && (
                               <div className="flex items-start gap-4 p-4 rounded-lg bg-accent/30 border border-border/50 min-w-[240px]">
                                  {renderThumbnail(selectedFilterProduct.imageUrl, selectedFilterProduct.name)}
                                  <div className="space-y-1">
                                     <p className="text-2xl font-bold text-primary">
                                       OMR {selectedFilterProduct.price.toFixed(2)}
                                     </p>
                                     {selectedFilterProduct.stock > 0 ? (
                                       <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 pointer-events-none">
                                          In Stock ({selectedFilterProduct.stock})
                                       </Badge>
                                     ) : (
                                       <Badge variant="destructive" className="pointer-events-none">Out of Stock</Badge>
                                     )}
                                  </div>
                               </div>
                            )}
                         </div>
                      ) : (
                        <div className="text-muted-foreground text-center py-4">No filter part number associated with this vehicle.</div>
                      )}
                    </div>
                 </div>

                 {/* Lubricant Options */}
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <h3 className="font-semibold text-lg">Lubricant Options</h3>
                       {!showLubricants && (
                          <Button onClick={() => setShowLubricants(true)} variant="outline" size="sm">
                             Show Options
                          </Button>
                       )}
                    </div>

                    {showLubricants && (
                       <div className="animate-in fade-in zoom-in-95 duration-300 space-y-4">
                          {/* Controls */}
                          <div className="flex flex-col sm:flex-row gap-4 justify-between bg-card p-4 rounded-lg border shadow-sm">
                             <div className="flex items-center gap-2">
                                <div className="flex p-1 bg-muted rounded-md">
                                  {["all", "petrol", "diesel"].map((type) => (
                                    <button
                                      key={type}
                                      onClick={() => setFuelType(type as any)}
                                      className={`px-3 py-1 text-xs font-medium rounded capitalize transition-all ${
                                        fuelType === type ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                                      }`}
                                    >
                                      {type}
                                    </button>
                                  ))}
                                </div>
                             </div>
                             <div className="flex items-center gap-2">
                                <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                                   <SelectTrigger className="w-[140px] h-8 text-xs">
                                      <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent>
                                      <SelectItem value="price-asc">Price: Low to High</SelectItem>
                                      <SelectItem value="price-desc">Price: High to Low</SelectItem>
                                   </SelectContent>
                                </Select>
                             </div>
                          </div>

                          {/* List */}
                          <div className="grid grid-cols-1 gap-3">
                             {filteredAndSortedLubricants.length > 0 ? (
                                filteredAndSortedLubricants.map((lubricant, index) => (
                                  <div key={index} className="group flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all">
                                     <div className="flex items-center gap-4 w-full sm:w-auto">
                                        {renderThumbnail(lubricant.imageUrl, lubricant.name)}
                                        <div className="space-y-1">
                                           <div className="flex items-baseline gap-2">
                                              <span className="font-bold text-foreground">{lubricant.brand}</span>
                                              <Badge variant="secondary" className="text-[10px] h-5">{lubricant.type}</Badge>
                                           </div>
                                           <p className="font-medium text-sm leading-tight text-muted-foreground">{lubricant.name}</p>
                                           {lubricant.specification && (
                                             <p className="text-xs text-muted-foreground/80">{lubricant.specification}</p>
                                           )}
                                        </div>
                                     </div>
                                     
                                     <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-4 sm:mt-0 gap-4 sm:gap-1">
                                        <div className="text-right">
                                           <div className="flex items-baseline gap-1 justify-end">
                                             <span className="text-xs text-muted-foreground">Total:</span>
                                             <span className="text-lg font-bold text-primary">
                                               OMR {(
                                                  (lubricant.pricePerLiter * vehicle.oil_capacity) + 
                                                  (selectedFilterProduct?.price || 0)
                                               ).toFixed(2)}
                                             </span>
                                           </div>
                                           <div className="text-xs text-muted-foreground flex gap-1 justify-end">
                                              <span>Oil: {(lubricant.pricePerLiter * vehicle.oil_capacity).toFixed(2)}</span>
                                              <span>+</span>
                                              <span>Filter: {(selectedFilterProduct?.price || 0).toFixed(2)}</span>
                                           </div>
                                        </div>
                                     </div>
                                  </div>
                                )) 
                             ) : (
                                <div className="text-center py-10 text-muted-foreground">No lubricants found matching criteria.</div>
                             )}
                          </div>
                       </div>
                    )}
                 </div>
               </div>

               {/* Right Side: Oil Volume Summary (Sticky) */}
               <div className="lg:col-span-4 order-1 lg:order-2">
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 sticky top-6 space-y-6">
                     <div className="flex items-center gap-3 text-primary mb-2">
                        <Droplets className="w-5 h-5" />
                        <h3 className="font-bold text-lg">Requirements</h3>
                     </div>
                     
                     <div className="text-center space-y-2 py-4">
                        <div className="text-5xl font-black text-black tracking-tighter">
                          {vehicle.oil_capacity}<span className="text-2xl ml-1 font-bold text-black/70">L</span>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Required Oil Volume</p>
                     </div>

                     <Separator className="bg-primary/20" />

                     <div className="space-y-3">
                        {/* Details removed as requested */}
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>

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
