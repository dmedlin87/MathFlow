import type { Generator } from "../types";
import { DecimalNotationGenerator as grade4_decimals_DecimalNotationGenerator, DecimalComparisonGenerator as grade4_decimals_DecimalComparisonGenerator } from "./grade4-decimals";
import { EquivFractionGenerator as grade4_fractions_EquivFractionGenerator, AddLikeFractionGenerator as grade4_fractions_AddLikeFractionGenerator, SubLikeFractionGenerator as grade4_fractions_SubLikeFractionGenerator, SimplifyFractionGenerator as grade4_fractions_SimplifyFractionGenerator, FracMultWholeGenerator as grade4_fractions_FracMultWholeGenerator, FracCompareUnlikeGenerator as grade4_fractions_FracCompareUnlikeGenerator, AddTenthsHundredthsGenerator as grade4_fractions_AddTenthsHundredthsGenerator, FracDecomposeGenerator as grade4_fractions_FracDecomposeGenerator, AddSubMixedGenerator as grade4_fractions_AddSubMixedGenerator } from "./grade4-fractions";
import { AreaPerimeterGenerator as grade4_meas_geo_AreaPerimeterGenerator, UnitConversionGenerator as grade4_meas_geo_UnitConversionGenerator, GeometryGenerator as grade4_meas_geo_GeometryGenerator, SymmetryGenerator as grade4_meas_geo_SymmetryGenerator, AngleMeasureGenerator as grade4_meas_geo_AngleMeasureGenerator, LinePlotGenerator as grade4_meas_geo_LinePlotGenerator, ShapeClassificationGenerator as grade4_meas_geo_ShapeClassificationGenerator, MoneyWordProblemGenerator as grade4_meas_geo_MoneyWordProblemGenerator, ProtractorGenerator as grade4_meas_geo_ProtractorGenerator, DataGraphGenerator as grade4_meas_geo_DataGraphGenerator } from "./grade4-meas-geo";
import { PlaceValueGenerator as grade4_nbt_PlaceValueGenerator, CompareMultiDigitGenerator as grade4_nbt_CompareMultiDigitGenerator, RoundingGenerator as grade4_nbt_RoundingGenerator, AddSubMultiGenerator as grade4_nbt_AddSubMultiGenerator, MultiplicationGenerator as grade4_nbt_MultiplicationGenerator, DivisionGenerator as grade4_nbt_DivisionGenerator, Mult1DigitGen as grade4_nbt_Mult1DigitGen, Mult2DigitGen as grade4_nbt_Mult2DigitGen } from "./grade4-nbt";
import { FactorsMultiplesGenerator as grade4_oa_FactorsMultiplesGenerator, PatternGenerator as grade4_oa_PatternGenerator, MultCompareGenerator as grade4_oa_MultCompareGenerator, MultiStepWordGen as grade4_oa_MultiStepWordGen } from "./grade4-oa";
import { AddSubUnlikeGenerator as grade5_fractions_AddSubUnlikeGenerator, FracDivGenerator as grade5_fractions_FracDivGenerator, ScalingGenerator as grade5_fractions_ScalingGenerator, MultFracGenerator as grade5_fractions_MultFracGenerator, DivFracGenerator as grade5_fractions_DivFracGenerator, FractionWordProblemsGenerator as grade5_fractions_FractionWordProblemsGenerator } from "./grade5-fractions";
import { VolumeCubesGenerator as grade5_meas_geo_VolumeCubesGenerator, VolumeFormulaGenerator as grade5_meas_geo_VolumeFormulaGenerator, CoordPlaneGenerator as grade5_meas_geo_CoordPlaneGenerator, ClassFiguresHierarchyGenerator as grade5_meas_geo_ClassFiguresHierarchyGenerator, UnitConv5Generator as grade5_meas_geo_UnitConv5Generator, LinePlotGenerator as grade5_meas_geo_LinePlotGenerator } from "./grade5-meas-geo";
import { PowersOf10Generator as grade5_nbt_PowersOf10Generator, DecimalFormsGenerator as grade5_nbt_DecimalFormsGenerator, CompareDecimalsGenerator as grade5_nbt_CompareDecimalsGenerator, RoundDecimalsGenerator as grade5_nbt_RoundDecimalsGenerator, AddSubDecimalsGenerator as grade5_nbt_AddSubDecimalsGenerator, MultWholeGenerator as grade5_nbt_MultWholeGenerator, MultDecimalsGenerator as grade5_nbt_MultDecimalsGenerator, DivWholeGenerator as grade5_nbt_DivWholeGenerator, DivDecimalsGenerator as grade5_nbt_DivDecimalsGenerator, FracDecConversionGenerator as grade5_nbt_FracDecConversionGenerator } from "./grade5-nbt";
import { OrderOpsGenerator as grade5_oa_OrderOpsGenerator, PatternsGenerator as grade5_oa_PatternsGenerator } from "./grade5-oa";
import { ExponentsGenerator as grade6_ee_ExponentsGenerator, OneStepEqGenerator as grade6_ee_OneStepEqGenerator, ExpressionsGenerator as grade6_ee_ExpressionsGenerator, EquivExpressionsGenerator as grade6_ee_EquivExpressionsGenerator, InequalitiesGenerator as grade6_ee_InequalitiesGenerator, VariablesGenerator as grade6_ee_VariablesGenerator } from "./grade6-ee";
import { AreaPolyGenerator as grade6_geometry_AreaPolyGenerator, SurfaceAreaGenerator as grade6_geometry_SurfaceAreaGenerator, VolumeFracGenerator as grade6_geometry_VolumeFracGenerator, PolygonsCoordGenerator as grade6_geometry_PolygonsCoordGenerator } from "./grade6-geometry";
import { DivFractionsGenerator as grade6_ns_DivFractionsGenerator, MultiDigitDivGenerator as grade6_ns_MultiDigitDivGenerator, DecimalOpsGenerator as grade6_ns_DecimalOpsGenerator, GcfLcmGenerator as grade6_ns_GcfLcmGenerator, IntegersGenerator as grade6_ns_IntegersGenerator, RationalNumberLineGenerator as grade6_ns_RationalNumberLineGenerator, CoordPlaneGenerator as grade6_ns_CoordPlaneGenerator } from "./grade6-ns";
import { RatiosGenerator as grade6_rp_RatiosGenerator, UnitRateGenerator as grade6_rp_UnitRateGenerator, PercentsGenerator as grade6_rp_PercentsGenerator, RatioTablesGenerator as grade6_rp_RatioTablesGenerator, UnitConversionRPGenerator as grade6_rp_UnitConversionRPGenerator } from "./grade6-rp";
import { MeanGenerator as grade6_stats_MeanGenerator, MedianModeRangeGenerator as grade6_stats_MedianModeRangeGenerator, IqrGenerator as grade6_stats_IqrGenerator, BoxPlotGenerator as grade6_stats_BoxPlotGenerator, DotPlotGenerator as grade6_stats_DotPlotGenerator, HistogramGenerator as grade6_stats_HistogramGenerator } from "./grade6-stats";


export const generators: Generator[] = [
  grade4_decimals_DecimalNotationGenerator,
  grade4_decimals_DecimalComparisonGenerator,
  grade4_fractions_EquivFractionGenerator,
  grade4_fractions_AddLikeFractionGenerator,
  grade4_fractions_SubLikeFractionGenerator,
  grade4_fractions_SimplifyFractionGenerator,
  grade4_fractions_FracMultWholeGenerator,
  grade4_fractions_FracCompareUnlikeGenerator,
  grade4_fractions_AddTenthsHundredthsGenerator,
  grade4_fractions_FracDecomposeGenerator,
  grade4_fractions_AddSubMixedGenerator,
  grade4_meas_geo_AreaPerimeterGenerator,
  grade4_meas_geo_UnitConversionGenerator,
  grade4_meas_geo_GeometryGenerator,
  grade4_meas_geo_SymmetryGenerator,
  grade4_meas_geo_AngleMeasureGenerator,
  grade4_meas_geo_LinePlotGenerator,
  grade4_meas_geo_ShapeClassificationGenerator,
  grade4_meas_geo_MoneyWordProblemGenerator,
  grade4_meas_geo_ProtractorGenerator,
  grade4_meas_geo_DataGraphGenerator,
  grade4_nbt_PlaceValueGenerator,
  grade4_nbt_CompareMultiDigitGenerator,
  grade4_nbt_RoundingGenerator,
  grade4_nbt_AddSubMultiGenerator,
  grade4_nbt_MultiplicationGenerator,
  grade4_nbt_DivisionGenerator,
  grade4_nbt_Mult1DigitGen,
  grade4_nbt_Mult2DigitGen,
  grade4_oa_FactorsMultiplesGenerator,
  grade4_oa_PatternGenerator,
  grade4_oa_MultCompareGenerator,
  grade4_oa_MultiStepWordGen,
  grade5_fractions_AddSubUnlikeGenerator,
  grade5_fractions_FracDivGenerator,
  grade5_fractions_ScalingGenerator,
  grade5_fractions_MultFracGenerator,
  grade5_fractions_DivFracGenerator,
  grade5_fractions_FractionWordProblemsGenerator,
  grade5_meas_geo_VolumeCubesGenerator,
  grade5_meas_geo_VolumeFormulaGenerator,
  grade5_meas_geo_CoordPlaneGenerator,
  grade5_meas_geo_ClassFiguresHierarchyGenerator,
  grade5_meas_geo_UnitConv5Generator,
  grade5_meas_geo_LinePlotGenerator,
  grade5_nbt_PowersOf10Generator,
  grade5_nbt_DecimalFormsGenerator,
  grade5_nbt_CompareDecimalsGenerator,
  grade5_nbt_RoundDecimalsGenerator,
  grade5_nbt_AddSubDecimalsGenerator,
  grade5_nbt_MultWholeGenerator,
  grade5_nbt_MultDecimalsGenerator,
  grade5_nbt_DivWholeGenerator,
  grade5_nbt_DivDecimalsGenerator,
  grade5_nbt_FracDecConversionGenerator,
  grade5_oa_OrderOpsGenerator,
  grade5_oa_PatternsGenerator,
  grade6_ee_ExponentsGenerator,
  grade6_ee_OneStepEqGenerator,
  grade6_ee_ExpressionsGenerator,
  grade6_ee_EquivExpressionsGenerator,
  grade6_ee_InequalitiesGenerator,
  grade6_ee_VariablesGenerator,
  grade6_geometry_AreaPolyGenerator,
  grade6_geometry_SurfaceAreaGenerator,
  grade6_geometry_VolumeFracGenerator,
  grade6_geometry_PolygonsCoordGenerator,
  grade6_ns_DivFractionsGenerator,
  grade6_ns_MultiDigitDivGenerator,
  grade6_ns_DecimalOpsGenerator,
  grade6_ns_GcfLcmGenerator,
  grade6_ns_IntegersGenerator,
  grade6_ns_RationalNumberLineGenerator,
  grade6_ns_CoordPlaneGenerator,
  grade6_rp_RatiosGenerator,
  grade6_rp_UnitRateGenerator,
  grade6_rp_PercentsGenerator,
  grade6_rp_RatioTablesGenerator,
  grade6_rp_UnitConversionRPGenerator,
  grade6_stats_MeanGenerator,
  grade6_stats_MedianModeRangeGenerator,
  grade6_stats_IqrGenerator,
  grade6_stats_BoxPlotGenerator,
  grade6_stats_DotPlotGenerator,
  grade6_stats_HistogramGenerator
];

export const skillGeneratorMap = new Map<string, Generator>(
  generators.map(g => [g.skillId, g])
);
