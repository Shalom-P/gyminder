# Evidence base

Every number and rule the coaching engine applies, the research behind it, and how strong that
research is. Exercise science gives **ranges and consensus**, not proofs. Where a value is a
heuristic chosen within an evidence-based range, it says so.

**How the citations were checked.** Each reference was matched to its PubMed, PMC, DOI or
publisher record (title, authors, journal, year, abstract). Full texts were not always available.
Points that rest on summaries rather than the paper itself are marked †. Preprints are marked as such.

The engine's job is to program healthy adults. It is not medical advice. Anyone with an injury,
a cardiovascular, metabolic or joint condition, or who is pregnant, should get clearance from a
clinician first.

## Programming rules → evidence

| Rule in the engine | Where | Evidence |
|---|---|---|
| **"Build muscle":** loaded compounds 6-10 reps (deadlift 5-8), accessories 8-12, isolation 10-20, bodyweight higher. | `data/exercises.ts` | Hypertrophy is similar across a wide load range when sets end near failure [7, 8, 9]. The deadlift sits lower because fatigue erodes its technique (coaching convention). |
| **"Get stronger":** main lifts 3-6 (deadlift 3-5), other compounds 5-8, accessories 6-10; rest 240 s on compounds, 150 s on accessories. | `prescribe()`, `restSeconds()` | Strength favours heavy loads, ≥~80% 1RM [8, 9, 10†]. Trained lifters need more than 2 min of rest for maximal strength [4]. ACSM: 3-5 min on heavy sets [5]. |
| **"General fitness":** 8-12 reps on loaded work. | `prescribe()` | ACSM novice and general-health range [5]. |
| **"Get shredded":** the "Build muscle" sets, reps and exercises unchanged (no light "toning" ranges, no volume cut); rest trimmed to 120 s compound, 90 s accessory, 75 s isolation; heavy sets stop 1-3 reps short of failure. Cardio and supersets are not programmed. | `prescribe()`, `restSeconds()`, `effortCue()` | Contest-prep review: most reps at 6-12 with 70-80% 1RM, a compound core plus isolation, 1-3 min rest, failure kept to single-joint and higher-rep work [71]. A deficit blunts lean-mass gains (ES −0.57) but not strength gains, and deficits above ~500 kcal/day stop lean-mass gains [72], so keeping the loads is the priority. Rest stays above the ~60-90 s floor where hypertrophy holds [1]. **No study tested these programming choices in a deficit directly**: they are carried over from maintenance-calorie research and expert review. Cardio and supersets are left out because their dose-response evidence did not hold up. |
| **Beginners:** at most 3 sets per exercise; 8-12 reps on compounds (5-8 if the goal is strength). | `prescribe()` | ACSM 2009: novices use 1-3 sets at 8-12 RM [5]. Low weekly doses (~4+ sets per muscle) still produce gains [13]. |
| **Rest:** 180 s compound, 120 s accessory, 90 s isolation. | `restSeconds()` | Rest over 60 s gives a small hypertrophy benefit; nothing measurable beyond ~90 s [1]. 3 min beat 1 min for strength and size in trained men [3]. Short and long rests both work [2]. Isolation reps hold up with ≥2 min at near-maximal loads [6], so 90 s is a time-efficient choice. |
| **Weekly volume:** the built-in splits aim for ~10-20 fractional sets per major muscle (synergists count ½). Tests assert 8-30, and ≥4 for once-a-week splits. | `data/splits.ts`, tests | ≥10 weekly sets beat fewer [11]. Half-counting indirect sets fit the data best, with diminishing returns [12]. ACSM 2026: ~10 sets per muscle per week [10†]. Minimum effective dose is ~4 sets [13]. |
| **Per-session cap:** ~10 direct sets per muscle in custom days. | `customSplit.ts` | Extra growth flattens around ~11 fractional sets per session [14], but that is a **preprint**, so it's applied as a soft cap. |
| **Frequency:** only splits that train each muscle ≥2×/week are recommended. The 3-day PPL and the bro split are labelled "below the twice-weekly guideline". | `recommendSplitId()` | ≥2×/week beat 1×/week when volume wasn't equated [15]. With volume equated, frequency mattered little for hypertrophy [16, 12] but helped strength [12]. ACSM 2026 and WHO say every major muscle group ≥2 days a week [10†, 29]. |
| **Split choice:** full body for 3 days, upper/lower for 4, beginners capped at 4 days, upper/lower when there is no equipment. | `recommendSplitId()` | Split and full-body routines did equally well with volume matched [28]. 3 vs 6 sessions a week gave similar results [17]. Novices: 2-3 days a week [5]. |
| **Recovery:** a muscle is ready 24 h after ≤4 fractional sets, 48 h after 5-9.5, 72 h after ≥10. There is a 20 h minimum gap between sessions. | `engine/schedule.ts` | Muscle protein synthesis is back near baseline by ~36 h [18]. Squat, bench and deadlift recover on similar timelines [20]. Curls recovered *slower* than rows [22]. Failure adds 24-48 h [21]. The old per-muscle windows (biceps 36 h vs chest 60 h) had no support. The three bands are a **heuristic** summary of these studies. |
| **Load progression:** double progression. Add the smallest step (2.5 kg / 5 lb), double on heavy lower-body lifts at ≥50 kg / 110 lb, or 2.5% if bigger. Steps always land on the weight wheel. | `applyResult()` | ACSM: add 2-10% once the target is exceeded [5]. Adding reps first and adding load both grow muscle [23]. |
| **Bodyweight moves and holds:** no reset at the top of the range; the session suggests a harder variation instead. | `applyResult()`, `buildPlan()` | Light loads only build muscle when taken near failure [7, 30]. Resetting to an easier target with no added load is a regression. |
| **Effort:** compounds stop with 1-3 reps in reserve (2-3 for strength); isolation and light bodyweight work go to 0-2. | `effortCue()` | Failure isn't needed for growth [24, 25, 27]. Growth improves with proximity to failure while strength stays flat [26]. Failure slows recovery [21]. Light loads need failure [30]. |

## Exercise pool → evidence

| Decision | Evidence |
|---|---|
| **Deadlift** is classified glute-led (synergists: hamstrings, back, quads) instead of "back". | EMG review of deadlift variants [31]. Hip-thrust and squat strength transfer to the deadlift [32]. |
| **Chin-up** → back (synergist: biceps). **Face pull / rear delt fly** → shoulders (rear delt). | Chin-ups vs pull-ups and pulldowns [33, 34]. Prone external-rotation raises gave peak posterior-delt EMG [35]. No face-pull EMG study was found. |
| **Squats and leg press** credit the glutes, not the hamstrings. | Full squats grew glutes and adductors; hamstrings didn't grow [36, 32]. Leg press underworks the rectus femoris [37]. |
| **Push-ups** substitute for bench press; feet-elevated is the harder variant, incline the easier one. | Similar strength gains [38] and hypertrophy [39] at matched effort. Push-up kinetics by variation [40]. |
| **Dumbbell bench** replaces barbell bench (expect ~17% less total load). | [41] |
| **Bulgarian split squat / lunges** substitute for the back squat; the dumbbell BSS is the dumbbell-tier squat partner. | Single-leg and two-leg training gave similar hypertrophy [42]. BSS mechanics [43]. |
| **Chest-supported row** spares the lower back. **Inverted row** is the bar-tier row. | Rowing exercises: lumbar load and lat activation [44]. |
| **Curls** stay in the program; chin-ups and rows are only fallbacks. | Pulldowns matched curls in novices [45], but curls beat rows for the biceps [46]. Single- vs multi-joint meta-analysis [47]. |
| **Overhead extensions** are preferred for the triceps (first substitute for pushdowns). | ~1.4× more triceps growth than arms-down extension [48]. |
| **Seated leg curl** is the default; the lying version is an alternative. | Seated (hip flexed) grew the hamstrings more [49]. |
| **Nordic curl** (low volume to start), **sliding/ball curls** for no-equipment knee flexion; hinges are not used as leg-curl substitutes. | Hamstring growth is exercise-specific [50, 51]. Nordic and ball-curl EMG [52, 53]. Low-volume Nordic programmes work [54]. Nordic-based programmes cut hamstring injuries [55] (effect size disputed). |
| **Standing calf raises** come first; single-leg for bodyweight. | Standing beat seated for the gastrocnemius [56]. Stretch-emphasis calf training [57]. |
| **Incline press** cued at ~30°. | Upper-chest EMG peaks near 30°; front delts take over at ≥45° [58]. Incline vs flat hypertrophy [59]. |
| **Lateral raises:** dumbbell and cable versions interchangeable; raise to shoulder height; no "pouring" internal rotation. | Highest side-delt EMG of four lifts [60]. Dumbbell = cable for growth [61]. Impingement signs with raises above 90° and with upright rows [62]. |
| **Excluded:** upright rows, behind-the-neck presses and pulldowns, bench dips. Dips cued to upper arm about parallel. | [62, 63, 64]. Dip mechanics [65] (bench dips: reasoned from mechanics, no injury data). |
| **Crunches** kept at moderate volume, with reverse crunch and planks as alternatives. | Spinal-flexion risk is mainly from cadaver studies [66]. Reverse crunch and hanging knee raises gave the highest ab EMG [67]. |
| **Planks** 30-60 s, then a harder variant instead of longer holds; side plank added. | Isometric core training [68]. McGill's "Big 3" progressions [69]. Long-lever plank EMG [70]. |
| **No-equipment options:** table row (needs a sturdy table), prone Y-T raise, sliding leg curl. | **Weak evidence.** They have the same mechanics as studied exercises [44, 35, 53], but none was studied directly. Labelled as such in the app. |

## Known limits

- **Muscle buckets are coarse.** For example, `shoulders` covers front, side and rear delts. Day readiness is therefore gated only on the muscles a day trains substantially (a compound's target, or ≥4 direct sets).
- **Progression assumes the target was met.** "Complete set" logs the programmed reps by design, so if the reps weren't there, lower the weight on the wheel.
- **No-equipment training is thin for the back and biceps.** No vertical pull is possible without a bar, so the app recommends upper/lower and says a doorway bar unlocks back training.

## References

1. Singer A et al. 2024. Give it a rest: a systematic review with Bayesian meta-analysis on the effect of inter-set rest interval duration on muscle hypertrophy. *Front Sports Act Living.* https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11349676/
2. Grgic J et al. 2017. The effects of short versus long inter-set rest intervals in resistance training on measures of muscle hypertrophy: a systematic review. *Eur J Sport Sci.* https://pubmed.ncbi.nlm.nih.gov/28641044/
3. Schoenfeld BJ et al. 2016. Longer interset rest periods enhance muscle strength and hypertrophy in resistance-trained men. *J Strength Cond Res.* https://doi.org/10.1519/JSC.0000000000001272
4. Grgic J et al. 2018. Effects of rest interval duration in resistance training on measures of muscular strength: a systematic review. *Sports Med.* https://doi.org/10.1007/s40279-017-0788-x
5. Ratamess NA et al. (ACSM) 2009. Progression models in resistance training for healthy adults. *Med Sci Sports Exerc.* https://doi.org/10.1249/MSS.0b013e3181915670
6. Senna GW et al. 2016. Effect of different interset rest intervals on performance of single and multijoint exercises with near-maximal loads. *J Strength Cond Res.* https://www.bisp-surf.de/Record/PU201603001186
7. Schoenfeld BJ, Grgic J, Ogborn D, Krieger JW. 2017. Strength and hypertrophy adaptations between low- vs. high-load resistance training: a systematic review and meta-analysis. *J Strength Cond Res.* https://pubmed.ncbi.nlm.nih.gov/28834797/
8. Lopez P et al. 2021. Resistance training load effects on muscle hypertrophy and strength gain: systematic review and network meta-analysis. *Med Sci Sports Exerc.* https://doi.org/10.1249/MSS.0000000000002585
9. Currier BS et al. 2023. Resistance training prescription for muscle strength and hypertrophy in healthy adults: a systematic review and Bayesian network meta-analysis. *Br J Sports Med.* https://pmc.ncbi.nlm.nih.gov/articles/PMC10579494/
10. Currier BS et al. (ACSM) 2026. Resistance training prescription for muscle function, hypertrophy, and physical performance in healthy adults: an overview of reviews. *Med Sci Sports Exerc.* https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823 († numbers taken from ACSM's summary)
11. Schoenfeld BJ, Ogborn D, Krieger JW. 2017. Dose-response relationship between weekly resistance training volume and increases in muscle mass. *J Sports Sci.* https://doi.org/10.1080/02640414.2016.1210197
12. Pelland JC et al. 2025. The resistance training dose response: meta-regressions exploring the effects of weekly volume and frequency on muscle hypertrophy and strength gains. *Sports Med.* https://link.springer.com/article/10.1007/s40279-025-02344-w
13. Iversen VM et al. 2021. No time to lift? Designing time-efficient training programs for strength and hypertrophy: a narrative review. *Sports Med.* https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8449772/
14. Remmert et al. 2025. Is there too much of a good thing? Meta-regressions of the effect of per-session volume on hypertrophy and strength. *SportRxiv* (**preprint**). https://sportrxiv.org/index.php/server/preprint/view/537
15. Schoenfeld BJ, Ogborn D, Krieger JW. 2016. Effects of resistance training frequency on measures of muscle hypertrophy: a systematic review and meta-analysis. *Sports Med.* https://pubmed.ncbi.nlm.nih.gov/27102172/
16. Schoenfeld BJ, Grgic J, Krieger J. 2019. How many times per week should a muscle be trained to maximize muscle hypertrophy? *J Sports Sci.* https://doi.org/10.1080/02640414.2018.1555906
17. Saric J et al. 2019. Resistance training frequencies of 3 and 6 times per week produce similar muscular adaptations in resistance-trained men. *J Strength Cond Res.* https://pubmed.ncbi.nlm.nih.gov/30363041/
18. MacDougall JD et al. 1995. The time course for elevated muscle protein synthesis following heavy resistance exercise. *Can J Appl Physiol.* https://pubmed.ncbi.nlm.nih.gov/8563679/
19. Damas F et al. 2016. Resistance training-induced changes in integrated myofibrillar protein synthesis are related to hypertrophy only after attenuation of muscle damage. *J Physiol.* https://pubmed.ncbi.nlm.nih.gov/27219125/
20. Belcher DJ et al. 2019. Time course of recovery is similar for the back squat, bench press, and deadlift in well-trained males. *Appl Physiol Nutr Metab.* https://pubmed.ncbi.nlm.nih.gov/30779596/
21. Morán-Navarro R et al. 2017. Time course of recovery following resistance training leading or not to failure. *Eur J Appl Physiol.* https://pubmed.ncbi.nlm.nih.gov/28965198/
22. Soares S et al. 2015. Dissociated time course of muscle damage recovery between single- and multi-joint exercises in highly resistance-trained men. *J Strength Cond Res.* https://www.bisp-surf.de/Record/PU201510008022
23. Plotkin D et al. 2022. Progressive overload without progressing load? The effects of load or repetition progression on muscular adaptations. *PeerJ.* https://peerj.com/articles/14142
24. Refalo MC et al. 2023. Influence of resistance training proximity-to-failure on skeletal muscle hypertrophy: a systematic review with meta-analysis. *Sports Med.* https://pmc.ncbi.nlm.nih.gov/articles/PMC9935748
25. Refalo MC et al. 2024. Similar muscle hypertrophy following eight weeks of resistance training to momentary muscular failure or with repetitions-in-reserve in resistance-trained individuals. *J Sports Sci.* https://pubmed.ncbi.nlm.nih.gov/38393985/
26. Robinson ZP et al. 2024. Exploring the dose-response relationship between estimated resistance training proximity to failure, strength gain, and muscle hypertrophy: a series of meta-regressions. *Sports Med.* https://rke.abertay.ac.uk/en/publications/exploring-the-dose-response-relationship-between-estimated-resist/
27. Grgic J et al. 2022. Effects of resistance training performed to repetition failure or non-failure on muscular strength and hypertrophy: a systematic review and meta-analysis. *J Sport Health Sci.* https://doi.org/10.1016/j.jshs.2021.01.007
28. Ramos-Campo DJ et al. 2024. Efficacy of split versus full-body resistance training on strength and muscle growth: a systematic review with meta-analysis. *J Strength Cond Res.* https://doi.org/10.1519/JSC.0000000000004774
29. Bull FC et al. 2020. World Health Organization 2020 guidelines on physical activity and sedentary behaviour. *Br J Sports Med.* https://www.ncbi.nlm.nih.gov/books/NBK566048/
30. Lasevicius T et al. 2022. Muscle failure promotes greater muscle hypertrophy in low-load but not in high-load resistance training. *J Strength Cond Res.* https://pubmed.ncbi.nlm.nih.gov/31895290/
31. Martín-Fuentes I et al. 2020. Electromyographic activity in deadlift exercise and its variants: a systematic review. *PLoS One.* https://pubmed.ncbi.nlm.nih.gov/32107499/
32. Plotkin DL et al. 2023. Hip thrust and back squat training elicit similar gluteus muscle hypertrophy and transfer similarly to the deadlift. *Front Physiol.* https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2023.1279170/full
33. Youdas JW et al. 2010. Surface electromyographic activation patterns and elbow joint motion during a pull-up, chin-up, or perfect-pullup rotational exercise. *J Strength Cond Res.* https://pubmed.ncbi.nlm.nih.gov/21068680/
34. Doma K et al. 2013. Kinematic and electromyographic comparisons between chin-ups and lat-pull down exercises. *Sports Biomech.* https://pubmed.ncbi.nlm.nih.gov/24245055/
35. Reinold MM et al. 2004. Electromyographic analysis of the rotator cuff and deltoid musculature during common shoulder external rotation exercises. *J Orthop Sports Phys Ther.* https://pubmed.ncbi.nlm.nih.gov/15296366/
36. Kubo K, Ikebukuro T, Yata H. 2019. Effects of squat training with different depths on lower limb muscle volumes. *Eur J Appl Physiol.* https://link.springer.com/article/10.1007/s00421-019-04181-y
37. Ema R et al. 2016. Unique activation of the quadriceps femoris during single- and multi-joint exercises. *Eur J Appl Physiol.* https://link.springer.com/10.1007/s00421-016-3363-5
38. Calatayud J et al. 2015. Bench press and push-up at comparable levels of muscle activity results in similar strength gains. *J Strength Cond Res.* https://pubmed.ncbi.nlm.nih.gov/24983847/
39. Kikuchi N, Nakazato K. 2017. Low-load bench press and push-up induce similar muscle hypertrophy and strength gain. *J Exerc Sci Fit.* https://pmc.ncbi.nlm.nih.gov/articles/PMC5812864/
40. Ebben WP et al. 2011. Kinetic analysis of several variations of push-ups. *J Strength Cond Res.* https://journals.lww.com/nsca-jscr/Fulltext/2011/10000/Kinetic_Analysis_of_Several_Variations_of_Push_Ups.31.aspx
41. Saeterbakken AH, van den Tillaar R, Fimland MS. 2011. A comparison of muscle activity and 1-RM strength of three chest-press exercises with different stability requirements. *J Sports Sci.* https://www.tandfonline.com/doi/abs/10.1080/02640414.2010.543916
42. Kassiano W et al. 2025. Comparison of muscle growth and dynamic strength adaptations induced by unilateral and bilateral resistance training: a systematic review and meta-analysis. *Sports Med.* https://pubmed.ncbi.nlm.nih.gov/39794667/
43. Mackey ER, Riemann BL. 2021. Biomechanical differences between the Bulgarian split-squat and back squat. *Int J Exerc Sci.* https://pmc.ncbi.nlm.nih.gov/articles/PMC8136570
44. Fenwick CMJ et al. 2009. Comparison of different rowing exercises: trunk muscle activation and lumbar spine motion, load, and stiffness. *J Strength Cond Res.* https://pubmed.ncbi.nlm.nih.gov/19197209/
45. Gentil P, Soares S, Bottaro M. 2015. Single vs. multi-joint resistance exercises: effects on muscle strength and hypertrophy. *Asian J Sports Med.* https://brieflands.com/journals/asjsm/articles/21609
46. Mannarino P et al. 2021. Single-joint exercise results in higher hypertrophy of elbow flexors than multijoint exercise. *J Strength Cond Res.* https://pubmed.ncbi.nlm.nih.gov/31268995/
47. Rosa A et al. 2023. Hypertrophic effects of single- versus multi-joint exercise of the limb muscles: a systematic review and meta-analysis. *Strength Cond J.* https://vuir.vu.edu.au/45635/
48. Maeo S et al. 2023. Triceps brachii hypertrophy is substantially greater after elbow extension training performed in the overhead versus neutral arm position. *Eur J Sport Sci.* https://pubmed.ncbi.nlm.nih.gov/35819335/
49. Maeo S et al. 2021. Greater hamstrings muscle hypertrophy but similar damage protection after training at long versus short muscle lengths. *Med Sci Sports Exerc.* https://pmc.ncbi.nlm.nih.gov/articles/PMC7969179/
50. Bourne MN et al. 2017. Impact of the Nordic hamstring and hip extension exercises on hamstring architecture and morphology. *Br J Sports Med.* https://bjsm.bmj.com/content/51/5/469
51. Maeo S et al. 2024. Hamstrings hypertrophy is specific to the training exercise: Nordic hamstring versus lengthened state eccentric training. *Med Sci Sports Exerc.* https://pmc.ncbi.nlm.nih.gov/articles/PMC11419281/
52. Krommes K et al. 2021. Cross-sectional study of EMG and EMG rise during fast and slow hamstring exercises. *Int J Sports Phys Ther.* https://pmc.ncbi.nlm.nih.gov/articles/PMC8329323
53. Monajati A et al. 2017. Analysis of the hamstring muscle activation during two injury prevention exercises. *J Hum Kinet.* https://gala.gre.ac.uk/id/eprint/17480/
54. Cuthbert M et al. 2020. The effect of Nordic hamstring exercise intervention volume on eccentric strength and muscle architecture adaptations. *Sports Med.* https://pmc.ncbi.nlm.nih.gov/articles/PMC6942028/
55. van Dyk N, Behan FP, Whiteley R. 2019. Including the Nordic hamstring exercise in injury prevention programmes halves the rate of hamstring injuries. *Br J Sports Med.* https://bjsm.bmj.com/content/53/21/1362
56. Kinoshita M et al. 2023. Triceps surae muscle hypertrophy is greater after standing versus seated calf-raise training. *Front Physiol.* https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2023.1272106/full
57. Kassiano W et al. 2023. Greater gastrocnemius muscle hypertrophy after partial range of motion training performed at long muscle lengths. *J Strength Cond Res.* https://pubmed.ncbi.nlm.nih.gov/37015016/
58. Rodríguez-Ridao D et al. 2020. Effect of five bench inclinations on the electromyographic activity of the pectoralis major, anterior deltoid, and triceps brachii during the bench press exercise. *Int J Environ Res Public Health.* https://pmc.ncbi.nlm.nih.gov/articles/PMC7579505/
59. Chaves SFN et al. 2020. Effects of horizontal and incline bench press on neuromuscular adaptations in untrained young men. *Int J Exerc Sci.* https://pubmed.ncbi.nlm.nih.gov/32922646/
60. Campos YAC et al. 2020. Different shoulder exercises affect the activation of deltoid portions in resistance-trained individuals. *J Hum Kinet.* https://pmc.ncbi.nlm.nih.gov/articles/PMC7706677
61. Larsen S et al. 2025. Dumbbell versus cable lateral raises for lateral deltoid hypertrophy: an experimental study. *Front Physiol.* https://pmc.ncbi.nlm.nih.gov/articles/PMC12277279/
62. Kolber MJ et al. 2014. Characteristics of shoulder impingement in the recreational weight-training population. *J Strength Cond Res.* https://journals.lww.com/nsca-jscr/fulltext/2014/04000/characteristics_of_shoulder_impingement_in_the.28.aspx
63. Kolber MJ, Corrao M, Hanney WJ. 2013. Characteristics of anterior shoulder instability and hyperlaxity in the weight-training population. *J Strength Cond Res.* https://pubmed.ncbi.nlm.nih.gov/22836608/
64. Sperandei S et al. 2009. Electromyographic analysis of three different types of lat pull-down. *J Strength Cond Res.* https://pubmed.ncbi.nlm.nih.gov/19855327/
65. McKenzie A et al. 2021. Glenohumeral extension and the dip: considerations for the strength and conditioning professional. *Strength Cond J.* https://journals.lww.com/nsca-scj/fulltext/2021/02000/glenohumeral_extension_and_the_dip__considerations.9.aspx
66. Contreras B, Schoenfeld B. 2011. To crunch or not to crunch: an evidence-based examination of spinal flexion exercises, their potential risks, and their applicability to program design. *Strength Cond J.* https://journals.lww.com/nsca-scj/fulltext/2011/08000/to_crunch_or_not_to_crunch__an_evidence_based.2.aspx
67. Escamilla RF et al. 2006. Electromyographic analysis of traditional and nontraditional abdominal exercises: implications for rehabilitation and training. *Phys Ther.* https://pubmed.ncbi.nlm.nih.gov/16649890/
68. Lee BCY, McGill SM. 2015. Effect of long-term isometric training on core/torso stiffness. *J Strength Cond Res.* https://journals.lww.com/nsca-jscr/fulltext/2015/06000/effect_of_long_term_isometric_training_on.8.aspx
69. McGill SM, Karpowicz A. 2009. Exercises for spine stabilization: motion/motor patterns, stability progressions, and clinical technique. *Arch Phys Med Rehabil.* https://pubmed.ncbi.nlm.nih.gov/19154838/
70. Schoenfeld BJ et al. 2014. An electromyographic comparison of a modified version of the plank with a long lever and posterior tilt versus the traditional plank exercise. *Sports Biomech.* https://pubmed.ncbi.nlm.nih.gov/25325773/
71. Helms ER, Fitschen PJ, Aragon AA, Cronin J, Schoenfeld BJ. 2015. Recommendations for natural bodybuilding contest preparation: resistance and cardiovascular training. *J Sports Med Phys Fitness.* https://ro.ecu.edu.au/ecuworkspost2013/1869
72. Murphy C, Koehler K. 2022. Energy deficiency impairs resistance training gains in lean mass but not strength: a meta-analysis and meta-regression. *Scand J Med Sci Sports.* https://portal.fis.tum.de/en/publications/energy-deficiency-impairs-resistance-training-gains-in-lean-mass-/

Not cited because they couldn't be verified: a primary source for McGill's "10-second holds"; any EMG study of the face pull; any study of the pike push-up, slider leg curl, dead bug (left out of the pool), goblet squat vs back squat, or glute bridge vs hip thrust.
