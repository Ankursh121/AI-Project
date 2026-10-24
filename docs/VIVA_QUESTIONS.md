# Academic Viva Questions & Technical Interview Bank

**Project:** AI-Based Emergency Evacuation Planning and Intelligent Route Optimization System  
**Audience:** B.Tech Computer Science Viva Voce, External Examiner Defense, and Technical Evaluation

---

### Category 1: AI Agents & Foundations

#### Q1: What makes this system an "AI System" rather than a simple script?
**Answer:** The system implements an **Intelligent Utility-Based Agent** operating within a dynamic, partially observable, and changing environment. The agent maintains an internal world model (the building graph), perceives dynamic environmental events (hazard diffusion, corridor crowd loads), evaluates multiple conflicting objectives (travel speed vs. hazard exposure vs. congestion delays), enforces hard safety constraints (wheelchair accessibility), and dynamically replans routes when unforeseen obstacles invalidate previous decisions.

#### Q2: What is the difference between this algorithmic AI system and a trained Machine Learning model?
**Answer:** This system utilizes **classical symbolic AI and heuristic search algorithms** (BFS, Dijkstra, A\*, Utility Theory) rather than statistical deep learning or neural networks. Search-based planning is chosen because emergency evacuation requires **100% determinism, mathematical optimality guarantees, verifiable safety, and zero hallucination risk**. Neural networks are black boxes that cannot guarantee that an impassable fire barrier won't be crossed; heuristic search with hard constraint pruning guarantees safety by construction.

#### Q3: What is a Utility-Based Agent, and what is its objective function?
**Answer:** A utility-based agent evaluates alternative state trajectories using a continuous scalar metric called **utility**, where higher utility represents preferable outcomes. Its objective is to maximize $U = 1.0 - \text{Disutility}$, where Disutility is a weighted composite penalty:
$$\text{Disutility} = w_{\text{time}} \cdot T_{\text{norm}} + w_{\text{hazard}} \cdot H_{\text{norm}} + w_{\text{congestion}} \cdot C_{\text{norm}}$$

#### Q4: Why can't a high utility score override a hard safety constraint?
**Answer:** Hard safety constraints represent physical impossibilities (e.g., a collapsed staircase or a wheelchair attempting to climb vertical steps). In our architecture, **hard constraint filtering occurs before utility scoring**. Inaccessible or blocked edges have their traversal cost set to infinity ($\infty$) and are pruned from candidate generation. Utility scoring only ranks passable, safe candidate paths.

---

### Category 2: Graph Theory & Data Modeling

#### Q5: How is a physical multi-floor building mapped to a mathematical graph $G = (V, E)$?
**Answer:** 
- **Vertices (Nodes $V$):** Represent discrete physical spaces and waypoints—classrooms, laboratories, offices, hallway junctions, stairwells, ramps, and emergency exits. Each node stores coordinates $(x, y, \text{floor})$, capacity, hazard severity, and accessibility flags.
- **Edges ($E$):** Represent navigable passageways connecting two nodes. Each edge stores physical length (meters), design flow capacity, width, hazard level, crowd density, and accessibility status.

#### Q6: Are the graph edges directed or undirected in this project?
**Answer:** Edges are **undirected by default** because most corridors allow two-way pedestrian movement. However, the data model supports an optional `one_way: bool` flag to model turnstiles, one-way security doors, or one-way descent chutes when necessary.

#### Q7: How does your graph representation prevent self-loops and invalid references?
**Answer:** Strict Pydantic validators (`model_validator` in `schemas.py` and `BuildingGraphModel`) inspect the entire graph at loading time. If an edge has `source == target`, or references a node ID not present in $V$, or contains negative distances/capacities, a descriptive `ValueError` is raised immediately.

---

### Category 3: BFS, Dijkstra & A\* Algorithms

#### Q8: What does Breadth-First Search (BFS) optimize, and why is it insufficient for real evacuations?
**Answer:** BFS minimizes the **number of edge hops (transitions)** between the starting room and an exit. It is insufficient because it treats a 5-meter empty corridor and a 50-meter smoke-filled corridor as having identical cost (1 hop). Consequently, BFS can choose a path with fewer hallway doors that is physically much longer or dangerously hazardous.

#### Q9: What data structure powers Dijkstra's algorithm, and what is its time complexity?
**Answer:** Dijkstra uses a **min-priority queue implemented as a binary min-heap** (`heapq` in Python). Its time complexity is $\mathcal{O}((|V| + |E|) \log |V|)$. Each node extraction takes $\mathcal{O}(\log |V|)$ and each edge relaxation takes $\mathcal{O}(\log |V|)$.

#### Q10: Why does Dijkstra require all edge weights to be non-negative ($w(e) \ge 0$)?
**Answer:** Dijkstra relies on the greedy invariant that once a node is popped from the min-heap, its calculated distance is permanently optimal. If negative edge weights were permitted, a subsequent longer path could later reduce its total cost below the popped node's cost, violating the invariant and causing incorrect routes or infinite negative cycles.

#### Q11: Explain the A\* formula $f(n) = g(n) + h(n)$.
**Answer:** 
- $g(n)$ is the exact cost already incurred from the starting location to node $n$.
- $h(n)$ is the estimated remaining cost from node $n$ to the nearest emergency exit.
- $f(n)$ is the estimated total cost of the complete route passing through node $n$. A\* expands the node with the lowest $f(n)$ value.

#### Q12: What does it mean for an A\* heuristic to be "admissible"?
**Answer:** A heuristic $h(n)$ is **admissible** if it never overestimates the true cost to reach the nearest goal:
$$h(n) \le h^*(n), \quad \forall n$$
If $h(n)$ never overestimates, A\* is mathematically guaranteed to find the optimal shortest path.

#### Q13: What specific heuristic function is implemented in this project?
**Answer:** We implement the **Multi-Goal Admissible 3D Euclidean Distance Heuristic**:
$$h(n) = \min_{e \in \mathcal{E}} \frac{\sqrt{(x_n - x_e)^2 + (y_n - y_e)^2 + (4.0 \cdot [f_n - f_e])^2}}{v_{\max}}$$
Because a straight line is the shortest distance between two points in physical 3D space, and dividing by maximum walking speed $v_{\max}$ provides a lower bound on travel time, $h(n) \le h^*(n)$ is strictly satisfied.

#### Q14: When does A\* degenerate into Dijkstra's algorithm?
**Answer:** When the heuristic function $h(n) = 0$ for all nodes. In that case, $f(n) = g(n)$, and nodes are expanded in pure uniform-cost order identical to Dijkstra.

#### Q15: Why does A\* typically expand fewer nodes than Dijkstra?
**Answer:** Dijkstra explores outward radially in all directions equally like an expanding circle. A\* adds the heuristic $h(n)$, which increases $f(n)$ for nodes heading away from the exit and decreases $f(n)$ for nodes heading towards the exit, focusing search directly along the target vector and pruning unproductive branches.

---

### Category 4: Dynamic Safety, Congestion & Hazards

#### Q16: Why is the geographically shortest route not always the safest route?
**Answer:** A route that is physically 20 meters long through dense smoke or a congested bottleneck has a vastly higher risk and longer evacuation time than a 35-meter clean, empty perimeter corridor. Our dynamic safety cost formula balances physical travel time against hazard penalties and crowd delays.

#### Q17: How is crowd congestion modeled in the simulation?
**Answer:** We compute normalized density $\rho = \frac{\text{occupants}}{\text{corridor capacity}}$. Based on pedestrian flow theory, walking velocity degrades non-linearly:
$$v_{\text{effective}} = v_{\text{nominal}} \times \max(0.25, 1.0 - 0.7 \cdot \min(1.0, \rho))$$
High density slows group progression and injects a congestion penalty into edge routing costs, guiding subsequent groups to uncrowded alternate paths.

#### Q18: What happens when an agent's assigned route becomes blocked mid-simulation?
**Answer:** Before taking a movement step, the agent validates its remaining route against the current environment. If an upcoming corridor has become blocked or exceeds the lethal hazard threshold ($H \ge 75$), the agent marks its route invalid, logs a rerouting event with the exact cause, and invokes the Utility Agent to calculate a new route from its current position.

#### Q19: Do agents teleport between rooms during simulation?
**Answer:** **No, teleportation is strictly forbidden.** Agents advance incrementally along each edge segment by $\Delta d = v_{\text{effective}} \times \Delta t$. They only arrive at the next node once cumulative edge distance is traversed.

#### Q20: How are wheelchair users and accessibility constraints handled?
**Answer:** Agents with `requires_accessible_route: True` enforce a hard constraint during graph neighbor expansion. Corridors or nodes marked `accessible: False` (such as stairwells) are completely pruned from the search graph. Wheelchair occupants are directed to step-free ground exits or external evacuation ramps.

---

### Category 5: Architecture, FastAPI & Software Engineering

#### Q21: Why was FastAPI chosen for the backend API?
**Answer:** FastAPI provides high performance (built on Starlette and Uvicorn), native asynchronous support, automatic JSON serialization/deserialization via Pydantic, and automatic OpenAPI/Swagger interactive documentation generation without boilerplate.

#### Q22: What is the purpose of Pydantic in this project?
**Answer:** Pydantic enforces strict runtime data validation, type checking, and boundary constraints. If an API request sends a negative walking speed or an invalid algorithm name, Pydantic immediately rejects it with a descriptive HTTP 422 Unprocessable Entity error.

#### Q23: Why is the `frontend/` directory kept empty in this repository?
**Answer:** To maintain a clean separation of concerns. The AI engine, graph algorithms, simulation models, and REST endpoints are engineered as an independent backend service. Any separate frontend (React, Vue, mobile app) can consume the system via documented REST endpoints.

#### Q24: What is the purpose of the mandatory academic disclaimer?
**Answer:** Simulation models make simplifying assumptions about crowd behavior and fire physics. Claiming an educational project is certified for real-world life-critical emergencies would be dangerous and unethical. The disclaimer explicitly clarifies that real evacuation decisions must adhere to official civil defense guidelines.

---

### Category 6: Advanced & Viva Edge Cases

#### Q25: How does the system handle a scenario where ALL exits are blocked?
**Answer:** If all exits are blocked or inaccessible, the algorithms return `found: False`, path `[]`, and the agent transitions to status `TRAPPED`. The system records a failure warning instructing occupants to shelter in place rather than inventing a non-existent or lethal route.

#### Q26: Can this system handle multi-floor buildings?
**Answer:** Yes. The building graph includes floor numbers (Floor 0, Floor 1), vertical stairwell connections, and 3D Euclidean heuristic distance calculations with a 4.0-meter floor elevation parameter.

#### Q27: How does the system ensure tests are reproducible?
**Answer:** The simulation scenarios use deterministic initial conditions and predictable step-based hazard spread rates. Running automated Pytest tests against the scenarios produces consistent, repeatable results.

#### Q28: What is the significance of the 33 Pytest automated tests?
**Answer:** The test suite verifies algorithm correctness (BFS hop minimization, Dijkstra optimality, A\* heuristic admissibility), safety constraints (wheelchair ramp selection, fire avoidance), multi-agent simulation step mechanics, and REST API contract compliance.

#### Q29: What are the main simplifying assumptions of this simulation?
**Answer:** 
1. Deterministic hazard spread rather than full computational fluid dynamics (CFD).
2. Group-based macro crowd flow rather than continuous individual social force collisions.
3. Rational agent behavior without panic or irrational stampeding.

#### Q30: How could this project be extended in a Master's thesis or industry implementation?
**Answer:** 
1. Integration with physical IoT sensors (smoke detectors, CCTV crowd density cameras).
2. Continuous agent-based physics simulation (Social Force Model).
3. Integration with BIM (Building Information Modeling) CAD/IFC floor plans.
4. Reinforcement learning for adaptive exit sign control.
