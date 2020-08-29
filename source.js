const EdgeType =
{
	Vertical : 0,
	LeftToRight : 1,		// 우상향
	RightToLeft : 2			// 우하향
};

const ToggleViewMode =
{
	ByAltitude : -1,
	ByTerrain : 0,
	ByTemperature : 1,
	ByPrecipitation : 2
};

class Tile
{
	constructor(x, y)
	{
		this.X = x;
		this.Y = y;
	}

	get IsLand()
	{
		if (tAltitude >= TRLANDALTITUDE)
			return true;
		else
			return false;
	}

	AngleOffset(y)
	{
		r = Mod(y, 2);
		return [[1, 0], [r, -1], [r - 1, -1], [-1, 0], [r - 1, 1], [r, 1] ];
	}

	static TRMAXALTITUDE = 4;
	static TRLANDALTITUDE = 2;	// 2 이상이면 땅이다.

	X;
	Y;

	IsContinent = false;	// 대륙이면 true, 섬이나 바다면 false.
	IsShore = false;		// 해안선에 인접해 있으면 true.
	LandmassNumber = -1;		// 땅덩이의 번호. Map 클래스에 땅덩이의 번호와 땅덩이의 면적이 짝지어져 있다.

	tAltitude = 0;				// 고도는 심해(0), 천해(1), 저지대(2), 중지대(3), 고지대(4)의 다섯 종류가 있다.
	tDistanceFromWest;	// 서쪽 해안으로부터의 거리.
	tDistanceFromEast;	// 동쪽 해안으로부터의 거리.
	tEffectiveDistance;	// 서쪽 해안과 동쪽 해안을 위도에 따라 가중치를 부여한 유효 거리.
	tVegetationColor;		// 식생에 의한 타일 색상.

	cMeanTemperature;		// 평균 기온은 대체로 위도가 낮을수록, 고도가 낮을수록, 따뜻한 바다에 가까울수록 높다.
	cTemperatureRange;	// 기온 범위는 대체로 고도가 높을수록, 바다에서 멀수록 크다.
	cTotalPrecipitation;	// 총 강수량은 대체로 위도가 중위도일수록, 고도가 낮을수록, 바다에 가까울수록 많다.
	cPrecipitationRange;	// 여름에 강수량이 많으면 (+), 겨울에 강수량이 많으면 (-).
};

Tile.TRMAXALTITUDE = 4;
Tile.TRLANDALTITUDE = 2;	// 2 이상이면 땅이다.
Tile.IsContinent = false;	// 대륙이면 true, 섬이나 바다면 false.
Tile.IsShore = false;		// 해안선에 인접해 있으면 true.
Tile.LandmassNumber = -1;		// 땅덩이의 번호. Map 클래스에 땅덩이의 번호와 땅덩이의 면적이 짝지어져 있다.
Tile.tAltitude = 0;

class Edge
{
	Type;
	X;
	Y;

	isRiver = false;
	
	constructor(t, x, y)
	{
		this.Type = t;
		this.X = x;
		this.Y = y;
	}

	VertexTiles(width, height)
	{
		r = Mod(Y, 2);
		t1, t2;

		if (Type == EdgeType.Vertical)
		{
			// 01이면 00과 02
			// 00이면 -1-1과 -11
			t1 = [Mod(X + r - 1, width), Y - 1];
			t2 = [Mod(X + r - 1, width), Y + 1];
		}
		else if (Type == EdgeType.LeftToRight)
		{
			// 11이면 20과 01
			// 12이면 11과 02
			t1 = [Mod(X + r, width), Y - 1];
			t2 = [Mod(X - 1, width), Y];
		}
		else
		{
			// 01이면 00과 11
			// 12이면 01과 22
			t1 = [Mod(X + r - 1, width), Y - 1];
			t2 = [Mod(X + 1, width), Y];
		}
		if (t1[1] < 0)
			return [t2];
		else if (t2[1] >= height)
			return [t1];
		else
			return [t1, t2];
	}

	SideTiles(width, height)
	{
		r = Mod(Y, 2);
		t1, t2;

		if (Type == EdgeType.Vertical)
		{
			// 10이면 00과 10
			// 11이면 01과 11
			t1 = [Mod(X - 1, width), Y];
			t2 = [X, Y];
		}
		else if (Type == EdgeType.LeftToRight)
		{
			// 01이면 00과 01
			// 12이면 01과 12
			t1 = [Mod(X + r - 1, width), Y - 1];
			t2 = [X, Y];
		}
		else
		{
			// 01이면 10과 01
			// 02이면 01과 02
			t1 = [Mod(X + r, width), Y - 1];
			t2 = [X, Y];
		}
		if (t1[1] < 0)
			return [t2];
		else if (t2[1] >= height)
			return [t1];
		else
			return [t1, t2];
	}

	static EdgeBetweenTiles(x1, y1, x2, y2, width)
	{
		r;
		if (y1 > y2 || (y1 == y2 && Mod(x1 - x2, width) == 1))
		{
			r = Mod(y1, 2);
			return [(y1 - y2) * Mod(x2 + 2 - x1 - r, width), x1, y1];
		}
		else
		{
			r = Mod(y2, 2);
			return [(y2 - y1) * Mod(x1 + 2 - x2 - r, width), x2, y2];
		}
	}

	OtherEdges(width, height, onetiley)
	{
		r = Mod(Y, 2);
		t1, t2;
		e1, e2;

		if (Type == EdgeType.Vertical)
		{
			// 01이면 00과 02
			// 00이면 -1-1과 -11
			t1 = [Mod(X + r - 1, width), Y - 1];
			t2 = [Mod(X + r - 1, width), Y + 1];
		}
		else if (Type == EdgeType.LeftToRight)
		{
			// 11이면 20과 01
			// 12이면 11과 02
			t1 = [Mod(X + r, width), Y - 1];
			t2 = [Mod(X - 1, width), Y];
		}
		else
		{
			// 01이면 00과 11
			// 12이면 01과 22
			t1 = [Mod(X + r - 1, width), Y - 1];
			t2 = [Mod(X + 1, width), Y];
		}
		if (t1[1] < 0 || t2[1] >= height)
			return [];
		else
		{
			if (t1[1] == onetiley)		// 시작하는 타일이 위에 있을 경우
			{
				if (Type == EdgeType.Vertical)
				{
					// 10이면 01과 01
					// 01이면 02와 02
					e1 = [EdgeType.LeftToRight, Mod(X + r - 1, width), Y + 1];
					e2 = [EdgeType.RightToLeft, Mod(X + r - 1, width), Y + 1];
				}
				else if (Type == EdgeType.LeftToRight)
				{
					// 11이면 우하향01과 수직11
					// 12이면 우하향02와 수직12
					e1 = [EdgeType.RightToLeft, Mod(X - 1, width), Y];
					e2 = [EdgeType.Vertical, X, Y];
				}
				else
				{
					// 01이면 우상향11과 수직11
					// 02이면 우상향12와 수직12
					e1 = [EdgeType.LeftToRight, Mod(X + 1, width), Y];
					e2 = [EdgeType.Vertical, Mod(X + 1, width), Y];
				}
			}
			else	// 시작하는 타일이 아래에 있을 경우
			{
				if (Type == EdgeType.Vertical)
				{
					// 11이면 우하향01과 우상향11
					// 12이면 우하향02와 우상향12
					e1 = [EdgeType.RightToLeft, Mod(X - 1, width), Y];
					e2 = [EdgeType.LeftToRight, X, Y];
				}
				else if (Type == EdgeType.LeftToRight)
				{
					// 01이면 수직10과 우하향01
					// 12이면 수직11과 우하향12
					e1 = [EdgeType.Vertical, Mod(X + r, width), Y - 1];
					e2 = [EdgeType.RightToLeft, X, Y];
				}
				else
				{
					// 01이면 수직10과 우상향01
					// 02이면 수직01과 우상향02
					e1 = [EdgeType.Vertical, Mod(X + r, width), Y - 1];
					e2 = [EdgeType.LeftToRight, X, Y];
				}
			}
			return [e1, e2];
		}
	}
}

Edge.isRiver = false;

class Civilization
{
	Population;
	Position = [0, 0];

	constructor(pop, x, y)
	{
		this.Population = pop;
		this.Position[0] = x;
		this.Position[1] = y;
	}
}

class Map
{
	LANDRATIO = 0.25;		// 전체 넓이 대 땅 넓이의 비율.
	MINCONTINENTAREA = 40;		// 대륙이 되기 위한 최소 넓이.

	PRDEFAULT = 0.0008;		// 0.0015 모든 타일의 기본 땅 생성 확률. 클수록 해안선이 복잡해진다.
	PRLANDCOEFF = 0.16;		// 0.08 기존의 땅 주변에서 또다른 땅이 생겨날 확률. 클수록 하나의 땅덩이가 넓어진다.
	PRROUGHCOEFF = 0.08;		// 0.2 기존의 땅이 높아질 확률. 낮으면 저지대가 많이 생성된다.
	PRTRYRIVER = 0.3;		// 조건이 되는 연안 타일들 중 실제로 강을 만들기 시작할 확률.
	PRTRYRIVERBRANCH = 0.06;	// 강이 분기할 확률.
	PRCOMPLEXCOASTLINE = 4;	// 복잡한 해안선을 만드는 루프를 반복할 횟수.

	Width;
	Height;

	Tiles;
	Rivers;
	LandmassAreas = [];

	PlayerCivilization = new Civilization();
	PlayerPosition = [];
	// public int[,] AIPositions;
	
	// 무작위 맵 생성자. 육각형 타일을 기본으로 한다.
	constructor(width)
	{
		// 좌우길이만 정해주면 상하길이는 루트 3으로 나눠준다.
		this.Width = width;
		this.Height = Math.round(width / Math.sqrt(3));
		
		// 타일과 강들을 초기화시켜준다.
		this.Tiles = new Array(this.Width);
		this.Rivers = new Array(3);
		for (let i = 0; i < this.Width; i++)
		{
			this.Tiles[i] = new Array(this.Height);
			this.Rivers[EdgeType.Vertical][i] = new Array(this.Height);
			this.Rivers[EdgeType.LeftToRight][i] = new Array(this.Height);
			this.Rivers[EdgeType.RightToLeft][i] = new Array(this.Height);
			for (let j = 0; j < this.Height; j++)
			{
				this.Tiles[i][j] = new Tile(i, j);
				this.Rivers[EdgeType.Vertical][i][j] = new Edge(EdgeType.Vertical, i, j);
				this.Rivers[EdgeType.LeftToRight][i][j] = new Edge(EdgeType.LeftToRight, i, j);
				this.Rivers[EdgeType.RightToLeft][i][j] = new Edge(EdgeType.RightToLeft, i, j);
			}
		}
		
		// 타일마다 자라날 확률을 정해준다.
		let p_tiles = new Float32Array(this.Width);

		// 대륙이 될 씨앗을 세 개 뿌린다.
		for (let i = 0; i < 3; i++)
		{
			let sx = Math.round(Math.random() * this.Width);
			let sy = Math.round(Math.random() * this.Height);
			Tiles[sx][sy].tAltitude = Tile.TRLANDALTITUDE;
		}

		// 씨앗으로부터 대륙을 키워나간다.
		bool NoContinents = true;
		while (NoContinents)
		{
			while (true)
			{
				// 땅의 총 넓이를 세고, 비율이 LANDRATIO 이상이면 나간다.
				int LandArea = 0;
				for (int x = 0; x < Width; x++)
				{
					for (int y = 0; y < Height; y++)
					{
						p_tiles[x, y] = Map.PRDEFAULT;
						if (Tiles[x, y].IsLand)
							LandArea++;
					}
				}
				if (LandArea >= Width * Height * LANDRATIO)
					break;

				// 각 타일의 땅이 생길 확률을 구한다.
				for (int x = 0; x < Width; x++)
				{
					for (int y = 0; y < Height; y++)
					{
						var v = Neighbors(x, y, 1);

						for (int i = 0; i < v.Count; i++)
						{
							int xx = v[i][0];
							int yy = v[i][1];
							if (yy >= 0 && yy < Height)
								p_tiles[Mod(xx, Width), yy] += Math.Min(Tiles[x, y].tAltitude, Tile.TRLANDALTITUDE + 0.1 * (Tiles[x, y].tAltitude - Tile.TRLANDALTITUDE)) * Map.PRLANDCOEFF;
						}

						v = Neighbors(x, y, 2);
						for (int i = 0; i < v.Count; i++)
						{
							int xx = v[i][0];
							int yy = v[i][1];
							if (yy >= 0 && yy < Height)
								p_tiles[Mod(xx, Width), yy] += Math.Min(Tiles[x, y].tAltitude, Tile.TRLANDALTITUDE + 0.1 * (Tiles[x, y].tAltitude - Tile.TRLANDALTITUDE)) * Map.PRLANDCOEFF / 4;
						}
					}
				}

				// 최종 확률에 따라 각 타일을 성장시킨다. 최종 확률은 위도에 따라 보정된다.
				for (int x = 0; x < Width; x++)
				{
					for (int y = 0; y < Height; y++)
					{
						double p = rnd.NextDouble();
						double lat = (double)(Height - 1 - 2 * y) / Height;
						if (p <= p_tiles[x, y] * (1 - lat * lat * 0.3))
						{
							int r;
							if (Tiles[x, y].IsLand)
							{
								p = rnd.NextDouble();
								if (p <= PRROUGHCOEFF)
									r = 1;
								else
									r = 0;
							}
							else
								r = 1;
							Tiles[x, y].tAltitude = Math.Min(Tiles[x, y].tAltitude + r, Tile.TRMAXALTITUDE);
						}
					}
				}
			}

			// 복잡한 해안선을 만든다.
			for (int k = 0; k < PRCOMPLEXCOASTLINE; k++)
			{
				for (int x = 0; x < Width; x++)
				{
					for (int y = 0; y < Height; y++)
					{
						var v = Neighbors(x, y, 1);
						int nn = 0;
						double p = rnd.NextDouble();
						for (int i = 0; i < v.Count; i++)
						{
							int xx = v[i][0];
							int yy = v[i][1];
							if (yy >= 0 && yy < Height && Tiles[Mod(xx, Width), yy].IsLand)
								nn++;
						}
						if ((nn >= 4 && nn <= 5) && Tiles[x, y].IsLand && p <= PRLANDCOEFF / (6 - nn))
							p_tiles[x, y] = -1;
						else if ((nn == 1 || nn == 2) && !Tiles[x, y].IsLand && p <= PRLANDCOEFF / nn)
							p_tiles[x, y] = 1;
						else
							p_tiles[x, y] = 0;
					}
				}
				for (int x = 0; x < Width; x++)
				{
					for (int y = 0; y < Height; y++)
					{
						Tiles[x, y].tAltitude = AB(Tiles[x, y].tAltitude + (int)p_tiles[x, y], 0, Tile.TRMAXALTITUDE);
					}
				}
			}

			// flood-fill 알고리즘으로 총 땅덩이의 수를 센다.
			int LandmassCount = 0;
			LandmassAreas.Clear();
			for (int x = 0; x < Width; x++)
			{
				for (int y = 0; y < Height; y++)
				{
					if (Tiles[x, y].IsLand && Tiles[x, y].LandmassNumber == -1)
					{
						LandmassAreas.Add(FloodFill(x, y, LandmassCount));
						LandmassCount++;
					}
				}
			}

			// 땅덩이 중 대륙이라고 부를 만한 땅덩이가 없으면 지도를 다시 만든다.
			for (int i = 0; i < LandmassCount; i++)
			{
				if (LandmassAreas[i] >= MINCONTINENTAREA)
					NoContinents = false;
			}
		}

		// 타일의 여러 속성들을 정해준다.
		for (int x = 0; x < Width; x++)
		{
			for (int y = 0; y < Height; y++)
			{
				// isContinent 속성을 정해준다.
				if (Tiles[x, y].IsLand && LandmassAreas[Tiles[x, y].LandmassNumber] >= MINCONTINENTAREA)
					Tiles[x, y].IsContinent = true;

				// isShore 속성을 정해준다.
				var v = Neighbors(x, y, 1);
				for (int i = 0; i < v.Count; i++)
				{
					int xx = v[i][0];
					int yy = v[i][1];
					if (yy >= 0 && yy < Height)
						if (Tiles[x, y].IsLand ^ Tiles[Mod(xx, Width), yy].IsLand)
							Tiles[x, y].IsShore = true;
				}

				// 땅 바로 옆에는 심해가 없도록 해준다.
				if (!Tiles[x, y].IsLand && Tiles[x, y].IsShore)
					Tiles[x, y].tAltitude = 1;
			}
		}

		// 강을 규칙에 따라 생성시킨다.
		// 연안 타일에서부터 강을 만들기 시작한다.
		var ShoreTiles = from t in ArrayExtensions.ToEnumerable(Tiles)
						 where !t.IsLand && t.IsShore
						 select new int[] { t.X, t.Y };

		Queue<int[]> queue = new Queue<int[]>();

		// 연안을 따라 큐에 강 후보지들을 넣는다.
		foreach (int[] ss in ShoreTiles)
		{
			int x = ss[0];
			int y = ss[1];
			int oyy = 0;		// 시작 타일의 y좌표.

			int[] edge = new int[] { };

			var v = Neighbors(x, y, 1);

			if (v.Count < 6)
				continue;

			// 바다 타일과 땅 타일 사이의 변을 시작점으로 집어넣는다.
			for (int i = 0; i < v.Count; i++)
			{
				if (Tiles[v[i][0],v[i][1]].tAltitude == Tile.TRLANDALTITUDE)
				{
					edge = Edge.EdgeBetweenTiles(x, y, v[i][0], v[i][1], Width);
					if (Tiles[v[Mod(i + 1, 6)][0], v[Mod(i + 1, 6)][1]].tAltitude == Tile.TRLANDALTITUDE && !Tiles[v[Mod(i - 1, 6)][0], v[Mod(i - 1, 6)][1]].IsLand)
						oyy = v[Mod(i - 1, 6)][1];
					else if (!Tiles[v[Mod(i + 1, 6)][0], v[Mod(i + 1, 6)][1]].IsLand && Tiles[v[Mod(i - 1, 6)][0], v[Mod(i - 1, 6)][1]].tAltitude == Tile.TRLANDALTITUDE)
						oyy = v[Mod(i + 1, 6)][1];
					else if (Tiles[v[Mod(i + 1, 6)][0], v[Mod(i + 1, 6)][1]].tAltitude == Tile.TRLANDALTITUDE && Tiles[v[Mod(i - 1, 6)][0], v[Mod(i - 1, 6)][1]].tAltitude == Tile.TRLANDALTITUDE)
					{
						if (rnd.Next(2) == 0)
							oyy = v[Mod(i - 1, 6)][1];
						else
							oyy = v[Mod(i + 1, 6)][1];
					}
					double p = rnd.NextDouble();
					if (p <= PRTRYRIVER)
						queue.Enqueue([edge[0], edge[1], edge[2], oyy]);
				}
			}
		}
		// 큐가 비어있지 않다면 강을 연장할 수 있는지 알아보고 확률에 따라 연장한다.
		while (queue.Any())
		{
			int[] q = queue.Dequeue();

			List<int[]> Candidates = Rivers[q[0], q[1], q[2]].OtherEdges(Width, Height, q[3]);
			List<double> Scores = new List<double> { 0, 0 };

			if (Candidates.Count < 2)
				continue;

			List<List<int[]>> Sides = new List<List<int[]>> { Rivers[Candidates[0][0], Candidates[0][1], Candidates[0][2]].SideTiles(Width, Height),
																Rivers[Candidates[1][0], Candidates[1][1], Candidates[1][2]].SideTiles(Width, Height) };
			List<List<int[]>> Vertices = new List<List<int[]>> { Rivers[Candidates[0][0], Candidates[0][1], Candidates[0][2]].VertexTiles(Width, Height),
																Rivers[Candidates[1][0], Candidates[1][1], Candidates[1][2]].VertexTiles(Width, Height) };
			List<int[]> Bases = new List<int[]> { new int[] { }, new int[] { } };
			List<int[]> Directs = new List<int[]> { new int[] { }, new int[] { } };
			List<List<int[]>> NextCandidates = new List<List<int[]>> { new List<int[]> { new int[] { }, new int[] { } }, new List<int[]> { new int[] { }, new int[] { } } };
			List<List<int[]>> Nears = new List<List<int[]>> { new List<int[]> { new int[] { }, new int[] { } }, new List<int[]> { new int[] { }, new int[] { } } };

			for (int i = 0; i < 2; i++)
			{
				if (Vertices[i].Count < 2)
					continue;

				if (Vertices[i][0].SequenceEqual(Sides[1 - i][0]) || Vertices[i][0].SequenceEqual(Sides[1 - i][1]))
				{
					Bases[i] = Vertices[i][0];
					Directs[i] = Vertices[i][1];
				}
				else
				{
					Bases[i] = Vertices[i][1];
					Directs[i] = Vertices[i][0];
				}

				NextCandidates[i][0] = Edge.EdgeBetweenTiles(Directs[i][0], Directs[i][1], Sides[i][0][0], Sides[i][0][1], Width);
				NextCandidates[i][1] = Edge.EdgeBetweenTiles(Directs[i][0], Directs[i][1], Sides[i][1][0], Sides[i][1][1], Width);

				Nears[i] = Neighbors(Directs[i][0], Directs[i][1], 1).Concat(Neighbors(Directs[i][0], Directs[i][1], 2)).ToList();

				// 주변에 저지대가 많을수록 좋은 후보.
				int NearLandCount = 0;
				for (int j = 0; j < Nears.Count; j++)
				{
					if (Tiles[Nears[i][j][0], Nears[i][j][1]].IsLand)
						NearLandCount++;
					if (Tiles[Nears[i][j][0], Nears[i][j][1]].tAltitude == Tile.TRLANDALTITUDE)
						Scores[i] += 0.05;
				}
				Scores[i] /= NearLandCount;
				// 강이 해안선과 평행하게 흐를 수는 없다.
				if (!Tiles[Sides[i][0][0], Sides[i][0][1]].IsLand || !Tiles[Sides[i][1][0], Sides[i][1][1]].IsLand)
					Scores[i] -= 999;
				// 양쪽 강변의 고도가 낮을수록 좋은 후보.
				Scores[i] += 0.25 * (Tile.TRMAXALTITUDE - (Tiles[Sides[i][0][0], Sides[i][0][1]].tAltitude + Tiles[Sides[i][1][0], Sides[i][1][1]].tAltitude) / 2);
				// 양쪽 강변의 고도가 차이가 덜 날수록 좋은 후보.
				Scores[i] -= 0.95 * (Math.Abs(Tiles[Sides[i][0][0], Sides[i][0][1]].tAltitude - Tiles[Sides[i][1][0], Sides[i][1][1]].tAltitude) - 0.5 * (Tile.TRMAXALTITUDE - Tile.TRLANDALTITUDE));
				// 강을 더 놓았을 때 기존의 강과 연결되는 것은 되도록이면 피할 것.
				if (Rivers[NextCandidates[i][0][0], NextCandidates[i][0][1], NextCandidates[i][0][2]].isRiver || Rivers[NextCandidates[i][1][0], NextCandidates[i][1][1], NextCandidates[i][1][2]].isRiver)
					Scores[i] -= 0.9;
				// 강은 거꾸로 흐를 수 없다.
				if (Tiles[Bases[i][0], Bases[i][1]].tAltitude > Tiles[Directs[i][0], Directs[i][1]].tAltitude)
					Scores[i] -= 999;
				// 바다에서 바다로 흐를 수 없다.
				if (!Tiles[Directs[i][0], Directs[i][1]].IsLand)
					Scores[i] -= 999;

			}
			// 두 후보 중 더 확률이 큰 쪽으로 강을 연장하고 두 번째 후보는 더 낮은 확률로 연장된다.
			double p = rnd.NextDouble();
			int ii;

			if (Scores[0] > Scores[1] || (Scores[0] == Scores[1] && rnd.Next(2) == 0))
				ii = 0;
			else
				ii = 1;

			if (p <= Scores[ii] && !Rivers[Candidates[ii][0], Candidates[ii][1], Candidates[ii][2]].isRiver)
			{
				Rivers[Candidates[ii][0], Candidates[ii][1], Candidates[ii][2]].isRiver = true;
				queue.Enqueue(new int[] { Candidates[ii][0], Candidates[ii][1], Candidates[ii][2], Bases[ii][1] });
			}
			// 두 번째 후보의 확률은 PRTRYRIVER만큼 줄어든다.
			p = rnd.NextDouble();
			ii = 1 - ii;
			if (p <= Scores[ii] * PRTRYRIVERBRANCH && !Rivers[Candidates[ii][0], Candidates[ii][1], Candidates[ii][2]].isRiver)
			{
				Rivers[Candidates[ii][0], Candidates[ii][1], Candidates[ii][2]].isRiver = true;
				queue.Enqueue(new int[] { Candidates[ii][0], Candidates[ii][1], Candidates[ii][2], Bases[ii][1] });
			}
		}

		// 기후 변수들을 할당해준다.
		// 우선 깊은 바다로부터의 거리를 정해준다.
		for (int y = 0; y < Height; y++)
		{
			for (int x = 0; x < Width; x++)
			{
				if (Tiles[x, y].tAltitude == 0)
				{
					int n = 0;
					int sw = 0;     // 연속된 해안 타일의 수. 특정 개수 이상 연속으로 반복되면 바다 타일과 같은 효과를 가진다.
					int se = 0;
					double dw = 0;
					double de = 0;
					while (true)
					{
						n++;
						if (Mod(n, Width) == 0)
							break;
						if (Tiles[Mod(x + n, Width), y].tAltitude == 0)
							dw = 0;
						else if (!Tiles[Mod(x + n, Width), y].IsLand)
						{
							if (++sw >= 3)
								dw = 0;
							dw += 0.1;
						}
						else
						{
							dw += 0.5 * Tiles[Mod(x + n, Width), y].tAltitude;
							sw = 0;
						}
						if (Tiles[Mod(x - n, Width), y].tAltitude == 0)
							de = 0;
						else if (!Tiles[Mod(x - n, Width), y].IsLand)
						{
							if (++se >= 3)
								de = 0;
							de += 0.1;
						}
						else
						{
							de += 0.5 * Tiles[Mod(x - n, Width), y].tAltitude;
							se = 0;
						}
						Tiles[Mod(x + n, Width), y].tDistanceFromWest = dw;
						Tiles[Mod(x - n, Width), y].tDistanceFromEast = de;
					}
					break;
				}
			}
		}
		// 기후 변수를 계산하고, 동시에 자원도 배치한다.
		for (int x = 0; x < Width; x++)
		{
			for (int y = 0; y < Height; y++)
			{
				// 유효거리는 서쪽 해안에서부터 잰 거리와 동쪽 해안에서부터 잰 거리를 위도에 따라 합성한 거리이다.
				double lat = (double)(Height - 1 - 2 * y) / Height;
				double alpha = (Math.Cos(Math.PI * lat) + 1) / 2;
				Tiles[x, y].tEffectiveDistance = (Tiles[x, y].tDistanceFromWest * Tiles[x, y].tDistanceFromEast) / (alpha * Tiles[x, y].tDistanceFromWest + (1 - alpha) * Tiles[x, y].tDistanceFromEast + 1);
				// 강수량은 위도가 낮을수록 많은데, 30도 부근에서 최저치가 되도록 보정항이 있고, 유효거리가 멀수록, 고도가 높을수록 추가로 감소한다.
				Tiles[x, y].cTotalPrecipitation = 15000 * Math.Pow(5, -3 * Math.Abs(lat) / 2) * (1 - 0.95 / ((Math.Abs(lat) - 0.25) * (Math.Abs(lat) - 0.25) * 23 + 1)) * (1 - lat * lat) * Math.Pow(2, -(Tiles[x, y].tEffectiveDistance * 0.11) - (Tiles[x, y].tAltitude - Tile.TRLANDALTITUDE));
				// 강수량 범위는 (서쪽 해안으로부터의 거리)-(동쪽 해안으로부터의 거리)에 따라 부호가 바뀐다.
				Tiles[x, y].cPrecipitationRange = Tiles[x, y].cTotalPrecipitation * Math.Tanh((Tiles[x, y].tDistanceFromWest - Tiles[x, y].tDistanceFromEast) / 10) * (1 - lat * lat);
				// 평균 온도는 주되게는 위도가 낮을수록 높고, 바닷바람이 적게 불수록 증가하고, 고도가 높을수록 감소한다. 강수량이 많으면 추가적으로 감소한다.
				Tiles[x, y].cMeanTemperature = Math.Cos(lat * Math.PI / 2) * 68 - Tiles[x, y].cTotalPrecipitation * 0.002 - 5 * (Tiles[x, y].tAltitude - Tile.TRMAXALTITUDE) - 44;
				// 온도 범위는 위도가 높아질수록, 해안으로부터의 거리가 멀어질수록 넓어진다.
				Tiles[x, y].cTemperatureRange = Math.Abs(lat * 11.7 * Math.Pow(Tiles[x, y].tEffectiveDistance * 40000 / Width, 0.2));
				// 식생에 의한 색깔은 강수량에 크게 의존하고 온도에도 의존한다.
				double VI = Math.Tanh(Math.Max(Tiles[x, y].cTotalPrecipitation / 500 - 0.2, 0));
				double PolarCapFactor = 0.5 * Math.Tanh(-(Tiles[x, y].cMeanTemperature + Tiles[x, y].cTemperatureRange / 2)) + 0.5;
				double TundraFactor = 0.5 * Math.Tanh(-(Tiles[x, y].cMeanTemperature + Tiles[x, y].cTemperatureRange / 2) / 2 + 4.5) + 0.5;
				Tiles[x, y].tVegetationColor = FromHSV(70 * VI + 20 + 30 * TundraFactor, AB(0.75 * VI + 0.25 - 0.3 * TundraFactor - PolarCapFactor, 0, 1), Math.Min(0.37 * VI + 0.85 * (1 - VI) - 0.1 * TundraFactor + PolarCapFactor, 1));

				// 식량 자원을 배치한다.

			}
		}

		// 플레이어의 위치를 정해준다. AI들도 위치시켜야 한다.
		var ContinentTiles = from t in ArrayExtensions.ToEnumerable(Tiles)
							 where t.IsContinent
							 select new int[] { t.X, t.Y };
		List<int[]> ct = ContinentTiles.ToList();
		PlayerPosition = ct[rnd.Next(ct.Count)];
		PlayerCivilization = new Civilization(100, PlayerPosition[0], PlayerPosition[1]);
	}

	public int FloodFill(int x, int y, int num)
	{
		if (Tiles[x, y].tAltitude < Tile.TRLANDALTITUDE)
			return 0;
		int area = 0;
		Queue<int[]> queue = new Queue<int[]>();
		queue.Enqueue(new int[] { x, y });
		while (queue.Any())
		{
			int xx, yy;
			int[] tt = queue.Dequeue();
			xx = tt[0];
			yy = tt[1];
			int[] west = new int[] { xx, yy };
			int[] east = new int[] { xx, yy };
			while (Tiles[Mod((west[0] - 1), Width), west[1]].LandmassNumber == -1 && Tiles[Mod((west[0] - 1), Width), west[1]].IsLand)
				west[0]--;
			while (Tiles[Mod((east[0] + 1), Width), east[1]].LandmassNumber == -1 && Tiles[Mod((east[0] + 1), Width), east[1]].IsLand)
				east[0]++;
			for (int i = west[0]; i <= east[0]; i++)
			{
				if (Tiles[Mod(i, Width), yy].LandmassNumber == -1)
				{
					Tiles[Mod(i, Width), yy].LandmassNumber = num;
					area++;
				}
				int r = Mod(yy, 2);
				if (yy > 0)
				{
					if (Tiles[Mod((i - 1 + r), Width), yy - 1].LandmassNumber == -1 && Tiles[Mod((i - 1 + r), Width), yy - 1].IsLand)
						queue.Enqueue(new int[] { Mod((i - 1 + r), Width), yy - 1 });
					else if (Tiles[Mod((i + r), Width), yy - 1].LandmassNumber == -1 && Tiles[Mod((i + r), Width), yy - 1].IsLand)
						queue.Enqueue(new int[] { Mod((i + r), Width), yy - 1 });
				}
				if (yy < Height - 1)
				{
					if (Tiles[Mod((i - 1 + r), Width), yy + 1].LandmassNumber == -1 && Tiles[Mod((i - 1 + r), Width), yy + 1].IsLand)
						queue.Enqueue(new int[] { Mod((i - 1 + r), Width), yy + 1 });
					else if (Tiles[Mod((i + r), Width), yy + 1].LandmassNumber == -1 && Tiles[Mod((i + r), Width), yy + 1].IsLand)
						queue.Enqueue(new int[] { Mod((i + r), Width), yy + 1 });
				}
			}
		}
		return area;
	}

	public List<int[]> Neighbors(int x, int y, int distance)
	{
		List<int[]> nn = new List<int[]> { };
		int[] temp = new int[] { x, y };

		if (distance == 0)
			return new List<int[]> { new int[] { x, y } };
		else
		{
			temp[0] -= distance;
			for (int i = 0; i < 6; i++)
			{
				for (int j = 0; j < distance; j++)
				{
					if (temp[1] >= 0 && temp[1] < Height)
						nn.Add(new int[] { Mod(temp[0], Width), temp[1] });
					int[] offset = Tile.AngleOffset(temp[1])[Mod(i - 1, 6)];
					temp[0] += offset[0];
					temp[1] += offset[1];
				}
			}
		}
		return nn;
	}

	public void HuntGatherMove(int dx, int dy)
	{
		if (Tiles[Mod((PlayerPosition[0] + dx), Width), AB(PlayerPosition[1] + dy, 0, Height - 1)].IsLand)
		{
			PlayerPosition[0] = Mod((PlayerPosition[0] + dx), Width);
			PlayerPosition[1] = AB(PlayerPosition[1] + dy, 0, Height - 1);
		}
	}
}
