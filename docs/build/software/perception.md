# Perception models

The models that turn pixels into detections. This is where the capability lives
and where the recurring engineering cost sits.

## Start with the licence, not the model

| Framework | Licence | Use |
|---|---|---|
| PyTorch | BSD-3 | Everything |
| torchvision | BSD-3 | Baseline detectors, safe |
| [MMDetection](https://github.com/open-mmlab/mmdetection) | Apache-2.0 | Wide model zoo, permissive |
| [RF-DETR](https://github.com/roboflow/rf-detr) | Apache-2.0 | Modern real-time detection transformer |
| RT-DETR | Apache-2.0 | Real-time DETR family |
| Ultralytics YOLO | **AGPL-3.0** or commercial | The easy one, and the expensive mistake |
| [SAHI](https://github.com/obss/sahi) | MIT | Tiled inference over large frames |
| ONNX Runtime | MIT | Deployment |
| TensorRT | Proprietary, free to use with NVIDIA hardware | Deployment on Jetson |

**Ultralytics is AGPL-3.0.** The AGPL's network clause reaches a hosted service,
not only a distributed binary, so a customer-facing product built on it either
carries source obligations or needs their commercial licence. Either is a valid
choice. Making it accidentally, eighteen months and 20,000 labelled frames
later, is not.

Start on an Apache-2.0 detector. The accuracy difference on agricultural
imagery is small; the licence difference is not.

## The dataset is the asset

A public weed dataset trained on another country's soil, camera, growth stage
and light will disappoint you. The model is commodity; the labelled data from
your own fields is not, and it is the only thing here a competitor cannot buy.

| Capability | First usable dataset | Effort |
|---|---|---|
| Weed detection, per crop | 2,000 to 5,000 labelled frames | The main cost. One-off per crop |
| Wildlife | 500 to 2,000 thermal frames with confirmed finds | A single spring |
| Counting, per crop | 300 to 1,000 frames, dot-labelled | Days |
| Disease | Often none: anomaly detection against the field's own history needs no labels | Free |
| Pest damage | Segmentation, 500 to 2,000 frames, or start with anomalies | |

Note the pattern: **the capabilities that need no labels are the ones to ship
first.** Change detection against a field's own history is unsupervised and
works from day one. See
[disease detection](/features/plant-disease-detection#how-it-works).

## Labelling

| Tool | Licence | Notes |
|---|---|---|
| [CVAT](https://www.cvat.ai) | MIT | Self-hosted, good for boxes, polygons and video |
| [Label Studio](https://labelstud.io) | Apache-2.0 | Flexible, self-hosted community edition |
| [FiftyOne](https://voxel51.com/fiftyone/) | Apache-2.0 | Dataset inspection and curation. Underrated |
| SAM-class segmenters | Check the specific release | Assisted labelling: click, get a mask, correct it |

Two practices that halve the cost:

**Assisted labelling.** Use a segmentation model to propose masks, and have the
human correct rather than draw. For leafy targets this is a large multiplier.

**Ground truth from the field.** Every time a scout walks to a flagged patch and
records what it was, that is a labelled example with a location and a date.
Build the capture form into the
[scouting route](/features/pest-monitoring#in-house-software) on day one, or
you will be labelling from scratch a year later.

## Training

| Practice | Why |
|---|---|
| Split by field and by date, never randomly | Random splits leak: two overlapping frames of the same plants land on both sides and the score is fiction |
| Hold out an entire farm | The only honest test of whether it generalises |
| Augment for the real variance | Sun angle, cloud, growth stage, soil colour. Not arbitrary colour jitter |
| Tile, do not resize | A 20 MP frame resized to 640 px has thrown the weeds away |
| Track versions | Model version pinned into every flight record, so a detection can be explained later |
| Evaluate on the decision | Precision and recall at the operating threshold, and treated-area error. Not mAP alone |

That last row matters commercially. A model with a slightly worse mAP that
produces a prescription 2% closer on treated area is the better model for this
product, because treated area is what the customer pays for and what
[the dashboard reports](/features/targeted-weed-control#what-the-dashboard-measures).

## Deployment

| Target | Path |
|---|---|
| Processing box | PyTorch or ONNX Runtime with CUDA |
| Jetson | ONNX to TensorRT, INT8 with a calibration set |
| Pi plus AI Kit | ONNX to Hailo's compiler |
| Anywhere | ONNX Runtime CPU as the always-works fallback |

Quantisation to INT8 typically costs under a point of accuracy and buys 2 to 4x
throughput. Always verify on your own held-out farm rather than trusting the
tooling's report.

## Tiled inference

Agricultural frames are large and targets are small. Naive resizing destroys
them.

1. Slice the frame into overlapping tiles at the model's native input size.
2. Run inference per tile.
3. Merge with non-maximum suppression across tile boundaries.
4. Project to ground coordinates.
5. Deduplicate across frame overlap.

[SAHI](https://github.com/obss/sahi) (MIT) implements steps 1 to 3. Steps 4 and
5 are yours, and step 5 is where double counting quietly ruins a yield
estimate. Validate against hand-counted quadrats every season.

## Counting: use density, not boxes

For dense objects like wheat ears, drawing a box around each of 400 objects in
a frame is unaffordable. Point-supervised **density map regression** needs one
click per object and predicts a count directly. It is the right architecture
for [yield forecasting](/features/yield-forecasting) and it costs a fraction of
the labelling.

## Change detection needs no model at all

For [disease](/features/plant-disease-detection) and
[pest](/features/pest-monitoring), the strongest first version is statistical:

1. Store every flight's calibrated index raster, aligned, keyed by field and
   date.
2. For each pixel, compute a z-score against that field's own history at the
   same growth stage.
3. Threshold, take connected components, rank by area times severity.

No labels, no training, and it directly implements "compared against the
field's own history, so a wet spring baseline does not read as disease". Add
supervised models later, to name the cause rather than to find the patch.

## Confidence, and what to do with it

Every detection carries a confidence. This repository stores it on the
`Detection` row and the field map varies marker opacity with it.

| Confidence | Action |
|---|---|
| High | Include in the prescription |
| Medium | Include, flag for the scouting route |
| Low | Escalate to a human reviewer, do not act on it |

The [escalation queue](/features/autonomous-network#in-house-software) is a
feature, not an admission. It is what lets you promise autonomy without
promising infallibility, and one reviewer can clear a day's ambiguous findings
across many farms in an hour.
