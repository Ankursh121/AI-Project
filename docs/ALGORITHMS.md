# Algorithm Reference & Mathematical Foundations

**Project:** Emergency Evacuation Planning System — An Intelligent Multi-Agent Route Optimization and Hazard Simulation System  
**Target Audience:** B.Tech Computer Science & Engineering (2nd & 3rd Year AI / Data Structures / Algorithms Curriculum)

---

## 1. Overview of Implemented Algorithms

The system implements four distinct routing mechanisms, moving progressively from unweighted graph search to informed heuristic search and multi-criteria intelligent agent decision-making:

1. **Breadth-First Search (BFS):** Unweighted graph search minimizing the number of edge transitions (corridor hops).
2. **Dijkstra's Algorithm:** Uniform-cost search computing the exact minimum cumulative weight path across non-negative weighted edges.
3. **A\* Search Algorithm:** Heuristic-guided informed search ($f(n) = g(n) + h(n)$) computing optimal paths with reduced node expansions.
4. **Utility-Based Intelligent Agent:** Multi-objective evaluation engine synthesizing travel time, hazard severity, and crowd congestion with hard accessibility constraint enforcement.

---

## 2. Dynamic Safety and Edge Cost Model

### 2.1 The Core Problem
In real-world evacuation scenarios, **the shortest geometric route is frequently NOT the safest or quickest route**. Corridors may be engulfed in smoke, structural debris may impede progress, or stampede-level congestion may reduce pedestrian velocity to a near standstill.

### 2.2 Mathematical Cost Formulation

For any directed connection $(u, v)$ with physical distance $d_{(u, v)}$ and nominal width $w$:

$$\text{Effective Cost}(u, v) = w_{\text{time}} \cdot T_{\text{eff}}(u, v) + w_{\text{hazard}} \cdot P_{\text{hazard}}(u, v) + w_{\text{crowd}} \cdot P_{\text{crowd}}(u, v)$$

Where:
- $w_{\text{time}} + w_{\text{hazard}} + w_{\text{crowd}} = 1.0$ (configurable trade-off weights).

#### Term 1: Effective Travel Time ($T_{\text{eff}}$)
$$T_{\text{eff}}(u, v) = \frac{d_{(u, v)}}{\max(0.2, v_{\text{effective}})}$$
- $d_{(u, v)}$: Corridor physical length in meters ($d > 0$).
- $v_{\text{effective}}$: Pedestrian walking speed in $\text{m/s}$, adjusted for local density.

#### Term 2: Hazard Penalty ($P_{\text{hazard}}$)
Hazards are scaled on a continuous normalized index $H \in [0.0, 100.0]$:
$$H_{\text{norm}} = \frac{\max(H_{\text{edge}}, H_{\text{target\_node}})}{100.0}$$
$$P_{\text{hazard}}(u, v) = \left(H_{\text{norm}}\right)^2 \times 100.0$$

- **Non-linear escalation:** Mild smoke ($H = 20$) yields penalty $(0.2)^2 \times 100 = 4.0\text{s}$. Dense smoke ($H = 60$) yields penalty $(0.6)^2 \times 100 = 36.0\text{s}$.
- **Impassable Threshold:** If $H \ge 75.0$, the corridor is marked **physically blocked** ($\text{Cost} = \infty$) and strictly excluded from traversal.

#### Term 3: Crowd Congestion Penalty ($P_{\text{crowd}}$)
Normalized crowd density $\rho$:
$$\rho = \frac{\text{Current Occupancy}}{\text{Design Capacity}}$$

$$P_{\text{crowd}}(u, v) = \begin{cases} 
0.0, & \text{if } \rho \le 0.2 \text{ (Free flow)} \\
(\rho - 0.2) \times 50.0 \times \left(\frac{d_{(u, v)}}{10.0}\right), & \text{if } \rho > 0.2 \text{ (Bottleneck delay)}
\end{cases}$$

### 2.3 Hand-Worked Numerical Example

Consider a corridor segment connecting **Classroom 101** to **Corridor West**:
- Distance $d = 10.0\text{ m}$
- Base walking speed $v = 1.25\text{ m/s}$
- Active hazard level $H = 40.0\text{ (Moderate smoke)}$
- Capacity $= 40\text{ persons}$, Current Occupants $= 24\text{ persons} \implies \rho = \frac{24}{40} = 0.60$
- Weights: $w_{\text{time}} = 0.35, w_{\text{hazard}} = 0.40, w_{\text{crowd}} = 0.25$

**Step 1: Calculate Effective Time ($T_{\text{eff}}$)**
$$T_{\text{eff}} = \frac{10.0}{1.25} = 8.0\text{ seconds}$$

**Step 2: Calculate Hazard Penalty ($P_{\text{hazard}}$)**
$$H_{\text{norm}} = \frac{40.0}{100.0} = 0.40$$
$$P_{\text{hazard}} = (0.40)^2 \times 100.0 = 16.0\text{ seconds equivalent}$$

**Step 3: Calculate Crowd Penalty ($P_{\text{crowd}}$)**
$$P_{\text{crowd}} = (0.60 - 0.20) \times 50.0 \times \left(\frac{10.0}{10.0}\right) = 0.40 \times 50.0 \times 1.0 = 20.0\text{ seconds equivalent}$$

**Step 4: Combine Weighted Cost**
$$\text{Cost} = (0.35 \times 8.0) + (0.40 \times 16.0) + (0.25 \times 20.0)$$
$$\text{Cost} = 2.80 + 6.40 + 5.00 = 14.20\text{ cost units}$$

*Conclusion:* Despite the hallway being only 10 meters long (8 seconds unimpeded), its composite cost is evaluated as **14.20**, accurately reflecting smoke exposure and crowd delay.

---

## 3. Algorithm 1: Breadth-First Search (BFS)

### 3.1 Purpose & Operating Principle
BFS explores the building graph in concentric uniform frontier rings using a First-In, First-Out (FIFO) queue. It discovers the exit that requires the **fewest corridor transitions (edge hops)**, assuming all connections are identical.

### 3.2 Pseudocode
```python
def breadth_first_search(graph, start_node, exits):
    if start_node in exits:
        return [start_node]
        
    queue = FIFOQueue()
    queue.enqueue(start_node)
    visited = {start_node}
    parent = {start_node: None}
    
    while not queue.is_empty():
        current = queue.dequeue()
        
        if current in exits:
            return reconstruct_path(parent, current)
            
        for neighbor, edge in graph.get_passable_neighbors(current):
            if neighbor not in visited:
                visited.add(neighbor)
                parent[neighbor] = current
                queue.enqueue(neighbor)
                
    return None  # No path found
```

### 3.3 Complexity Analysis
- **Time Complexity:** $\mathcal{O}(|V| + |E|)$, where $|V|$ is the number of locations (nodes) and $|E|$ is the number of corridors (edges). Every vertex and edge is visited at most once.
- **Space Complexity:** $\mathcal{O}(|V|)$ to store the FIFO queue, visited set, and parent reconstruction pointers.

### 3.4 Key Academic Limitation
BFS **cannot evaluate edge weights**. A corridor of 50 meters counts as 1 hop, exactly the same as a doorway of 2 meters. Therefore, BFS guarantees the minimum number of doorways passed through, but **does not guarantee shortest physical distance or travel time**.

---

## 4. Algorithm 2: Dijkstra's Algorithm

### 4.1 Purpose & Priority Queue Mechanics
Dijkstra's algorithm finds the path with the minimum cumulative non-negative edge weight. It maintains a priority queue (min-heap) of discovered nodes ordered by their known distance from the starting location.

### 4.2 Multi-Exit Termination Guarantee
When searching for the closest exit among multiple candidate exits $\{E_1, E_2, \dots, E_k\}$:
1. Initialize $\text{dist}[\text{start}] = 0$, all other nodes $\infty$.
2. Pop minimum cost node $u$ from priority queue.
3. If $u \in \{E_1, \dots, E_k\}$, **terminate immediately**.
*Proof of Optimality:* Because all edge weights $w(e) \ge 0$, any other path currently pending in the min-heap already has a cost greater than or equal to $u$'s cost. Subsequent edge expansions can only add non-negative cost, meaning $u$ is guaranteed to be the least-cost reachable exit.

### 4.3 Pseudocode
```python
import heapq

def dijkstra_search(graph, start_node, exits, weight_function):
    min_heap = []
    heapq.heappush(min_heap, (0.0, start_node))
    
    cost_to_reach = {start_node: 0.0}
    parent = {start_node: None}
    visited = set()
    
    while min_heap:
        current_cost, current_node = heapq.heappop(min_heap)
        
        if current_node in visited:
            continue
        visited.add(current_node)
        
        if current_node in exits:
            return reconstruct_path(parent, current_node), current_cost
            
        for neighbor, edge in graph.get_passable_neighbors(current_node):
            if neighbor in visited:
                continue
                
            edge_weight = weight_function(edge)
            new_cost = current_cost + edge_weight
            
            if neighbor not in cost_to_reach or new_cost < cost_to_reach[neighbor]:
                cost_to_reach[neighbor] = new_cost
                parent[neighbor] = current_node
                heapq.heappush(min_heap, (new_cost, neighbor))
                
    return None, float("inf")
```

### 4.4 Complexity Analysis
- **Time Complexity:** $\mathcal{O}((|V| + |E|) \log |V|)$ using binary heap (`heapq`).
- **Space Complexity:** $\mathcal{O}(|V|)$ to store heap entries, distance hash map, and parent pointers.

---

## 5. Algorithm 3: A\* Search Algorithm

### 5.1 The Evaluation Function
$$f(n) = g(n) + h(n)$$
- $g(n)$: Exact accumulated path cost from the starting node to current node $n$.
- $h(n)$: Heuristic estimate of the remaining cost from node $n$ to the closest valid exit.
- $f(n)$: Estimated total cost of the complete route passing through $n$.

### 5.2 Multi-Goal Admissible 3D Euclidean Heuristic

For a building with multiple exits $\mathcal{E} = \{e_1, e_2, \dots, e_k\}$, the heuristic function evaluates straight-line distance to the **nearest** valid exit:

$$h_{\text{dist}}(n) = \min_{e \in \mathcal{E}} \sqrt{(x_n - x_e)^2 + (y_n - y_e)^2 + (4.0 \cdot [f_n - f_e])^2}$$

Where $4.0\text{ meters}$ represents floor-to-floor vertical clearance.

#### Proof of Admissibility ($h(n) \le h^*(n)$)
1. In Euclidean space, the shortest possible distance between two physical points is a straight line.
2. Any physical walkway, staircase, or ramp has distance $d_{\text{graph}} \ge d_{\text{Euclidean}}$.
3. Taking the minimum over all exits guarantees that $h(n)$ does not overestimate the distance to any reachable exit.
4. When optimizing for travel time at speed $v \le v_{\max}$:
   $$h_{\text{time}}(n) = \frac{h_{\text{dist}}(n)}{v_{\max}} \le \frac{d^*}{v_{\text{actual}}} = g^*(n)$$
   Thus, $h(n)$ is strictly admissible, guaranteeing that **A\* returns the mathematically optimal route**.

### 5.3 Pseudocode
```python
def astar_search(graph, start_node, exits, weight_fn, heuristic_fn):
    min_heap = []
    start_h = heuristic_fn(start_node)
    heapq.heappush(min_heap, (start_h, 0.0, start_node))
    
    g_score = {start_node: 0.0}
    parent = {start_node: None}
    visited = set()
    
    while min_heap:
        f_val, g_val, current = heapq.heappop(min_heap)
        
        if current in visited:
            continue
        visited.add(current)
        
        if current in exits:
            return reconstruct_path(parent, current), g_score[current]
            
        for neighbor, edge in graph.get_passable_neighbors(current):
            if neighbor in visited:
                continue
                
            tentative_g = g_score[current] + weight_fn(edge)
            
            if neighbor not in g_score or tentative_g < g_score[neighbor]:
                g_score[neighbor] = tentative_g
                parent[neighbor] = current
                h_val = heuristic_fn(neighbor)
                f_val = tentative_g + h_val
                heapq.heappush(min_heap, (f_val, tentative_g, neighbor))
                
    return None, float("inf")
```

### 5.4 Comparison: A\* vs Dijkstra
| Dimension | Dijkstra's Algorithm | A\* Search Algorithm |
| :--- | :--- | :--- |
| **Search Strategy** | Uninformed / Radial Uniform Cost | Informed / Goal-Directed |
| **Node Expansion** | Expands equally in all directions | Prunes nodes directed away from target exits |
| **Optimality** | Guaranteed optimal | Guaranteed optimal (with admissible $h$) |
| **Typical Expansions** | Higher node count | Significantly lower node count in spatial graphs |

---

## 6. Algorithm 4: Utility-Based Intelligent Agent

### 6.1 Multi-Criteria Utility Architecture
The Utility Agent formulates evacuation as a multi-criteria decision-making problem under hard safety and accessibility constraints:

```
[Candidate Route Generation]
       │
       ▼
[Hard Constraint Filtering] ──► (Disqualify: Blocked / Stairs for Wheelchairs / Lethal Fire)
       │
       ▼
[Metric Normalization (Time, Hazard, Congestion)]
       │
       ▼
[Weighted Disutility Computation: D = w_t*T + w_h*H + w_c*C]
       │
       ▼
[Utility Maximization: U = 1.0 - D]
       │
       ▼
[Natural Language Explanatory Rationale Generation]
```

### 6.2 Hard vs. Soft Constraints
- **Hard Constraints (Non-Negotiable):**
  - Physically blocked corridors or exits ($\text{is\_blocked} = \text{True}$) $\implies$ Exclusion.
  - Inaccessible infrastructure for wheelchair users ($\text{accessible} = \text{False}$) $\implies$ Exclusion.
  - Lethal hazard severity ($H \ge 75.0$) $\implies$ Exclusion.
  - *Hard constraints cannot be overridden by any utility score.*
- **Soft Constraints (Optimization Objectives):**
  - Travel time minimization.
  - Mild smoke / hazard avoidance.
  - Hallway crowd congestion avoidance.

### 6.3 Dynamic Explanatory Synthesis
Rather than returning an opaque numeric path, the agent inspects the metrics of alternative candidates and synthesizes a plain-English explanation:

$$\text{"Route via East Ramp was selected with utility 0.88. Although it has 15m greater physical distance than West Corridor (time +8s), it completely avoids the high hazard level (45/100 smoke) in West Corridor and bypasses heavy crowd congestion (75% capacity) at the West Exit, reducing overall risk by 62%."}$$
