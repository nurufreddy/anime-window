# Model choice and license notes

Updated October 6: the default is now AnimeGANv3 Ghibli-c1, after a same-input visual and timing comparison. The prior Face Portrait model is retained only as an optional legacy style.

Investigated against primary repositories and official documentation on October 5, 2026. No claim is made about the original reference creator's implementation.

| Approach                                   | Mac/browser fit                                                                                          | Visual behavior and timing                                                                                                                               | Availability/cost/license                                                                                                                                                                                          | Decision                                                                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| AnimeGANv3 Ghibli-c1 (2025 portrait model) | Tested on Apple WebGPU in the browser; CPU fallback is also implemented                                  | Cleaner illustrated facial features in the close-up comparison. Dynamic NHWC input; 512 px prioritizes quality. No temporal or identity guarantees.      | Public ~7 MB official ONNX release; no API fee. AnimeGANv3 is noncommercial without separate permission.                                                                                                           | **New default**, 512 px; 256 px speed option.                                                                                    |
| AnimeGANv2 Face Portrait v2, ONNX          | ONNX Runtime WebGPU with WASM fallback; no CUDA or server                                                | Actual frame-by-frame neural portrait stylization; no identity or temporal guarantees. Every frame responds to input; no static portrait. Tested here.   | Public ~8.6 MB conversion; no API fees. MIT notices in conversion and PyTorch repos; upstream AnimeGANv2 restricts its original assets to noncommercial use.                                                       | Legacy comparison option. Conservative personal/noncommercial use; verify weight rights before redistribution or commercial use. |
| Original AnimeGANv2 Hayao/Shinkai/Paprika  | Original setup lists old TensorFlow GPU/CUDA; ONNX files also available                                  | Targets landscapes rather than portrait expressions. Potentially useful for scenery, less suitable for this face-centered goal. Not benchmarked here.    | Public weights; original repo expressly requires commercial authorization.                                                                                                                                         | Not selected.                                                                                                                    |
| StreamDiffusion                            | Official acceleration/setup uses PyTorch CUDA, xformers/TensorRT; not a supported native Apple M3 recipe | More flexible prompted img2img; identity, expressions and flicker depend on strength/model. Repository GPU benchmarks do not predict this Mac's latency. | Pipeline Apache-2.0; underlying diffusion weights have separate terms. A hosted deployment would require GPU hosting charges, credentials, and explicit frame-upload approval. No service was selected or charged. | Rejected for this local Mac implementation.                                                                                      |

The converted Face Portrait model was the first local implementation, not proof of the reference's anime quality or of 30 generated frames per second. The model was trained on 512×512 portraits. Lower-resolution inference trades detail for speed; examples are inspected and performance is measured in the verification report. Temporal consistency and blink preservation must be evaluated with live video.

## Sources

- [Model author's PyTorch implementation and Face Portrait v2 weights](https://github.com/bryandlee/animegan2-pytorch)
- [Browser ONNX conversion and conversion notebook](https://github.com/josephrocca/anime-gan-v2-web)
- [Original AnimeGANv2 requirements and noncommercial license statement](https://github.com/TachibanaYoshino/AnimeGANv2)
- [StreamDiffusion official repository](https://github.com/cumulo-autumn/StreamDiffusion)
- [ONNX Runtime Web documentation](https://onnxruntime.ai/docs/tutorials/web/)
- [MediaPipe Hand Landmarker web guide](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js)

MIT license copies from the conversion and PyTorch implementations are preserved in this directory. They are not a blanket claim that every upstream model asset is commercially cleared. MediaPipe code is Apache-2.0 and ONNX Runtime code is MIT; installed npm packages retain their own license files. MediaPipe's model is downloaded directly from Google's versioned model storage. Review Google's applicable model terms for redistribution.

No remote inference integration is included because the selected path runs locally. There are no secrets or environment variables to configure.

## New default provenance

- [Official AnimeGANv3 repository, Ghibli-c1 release announcement and license](https://github.com/TachibanaYoshino/AnimeGANv3)
- [Official Ghibli-c1 ONNX release](https://github.com/TachibanaYoshino/AnimeGANv3_Portrait_Inference/releases/tag/1.0)
- [Author's inference code: RGB normalization and NHWC input/output](https://github.com/TachibanaYoshino/AnimeGANv3/blob/master/deploy/test_by_onnx.py)
- [Portrait-inference guidance: small/blurry faces reduce quality](https://github.com/TachibanaYoshino/AnimeGANv3_Portrait_Inference)

This model remains subject to the author's noncommercial terms. Download/setup does not grant commercial rights. No remote GPU or webcam upload is used.
