# Predict rating changes

## Algorithm contest

### Running contest

**Predicting performance**:  
* Calculate the average performance of every participants in the contest (**formular 1**). Note that we use **InnerPerformance** here.
* Calculate the performance array (*PerfArr*) by rank (**formular 2**). In a contest, based on the perf of all participants, the performance array will vary. Now user in rank k have performance of PerfArr[k]

**Predicting rating**:  
To predict rating we have 2 formulars:
* Predict with (curRating, contest_performance, past_competition_num)  
In the first way, we only need to return the *PerfArr*, the rest parameters can get from Atcoder API. Fast but less accurate for new comer (with < 5 rated contests)  
    ```js
    cal_from_last(curRating, contest_performance, past_competition_num)
    ```
* Predict with the performance array (**Rounded Performance**)    
The second way is the correct way to calculate rating (**formular 8**). We need to return the rounded performance history of all participants. 
    ```js
    past_performance = []
    cur_performance = PerfArr[r]
    all_perf_history = [...past_performance, cur_performance].reverse()
    cal_from_perf_arr(all_perf_history)
    ```


### Past contest
> A past contest is a contest that has the final result

Get data from atcoder

**Extended standing**:  
Make prediction for the extended standing table after the contest was over only.

## Heuristic contest

### Running contest

Get data from github

### Past contest
Get data from atcoder
