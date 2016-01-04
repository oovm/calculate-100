(* ::Package:: *)

LeftTeeArrow[x_,y_]:=x-y;
RightTeeArrow[x_,y_]:=-x+y;
AngleBracket[t_Integer,u_Integer]:=10 ^IntegerLength[u]t+u;
enumerate[digits_]:=Module[
	{n=Length[digits],u=2 Max[digits]+1,places,evaluate},
	evaluate[n_List,m_Integer]:=Append[n,m];
	evaluate[{n___,a_,b_},op_]:={n,op[a,b]};
	places=Select[
	Permutations[ConstantArray[u,n-1]~Join~ConstantArray[-u,n-1]],
	Min[Accumulate[#]]>=0&
	];
	Flatten[Function[{x},
	Block[
	{i=0,j=1},
	Fold[evaluate,{},Prepend[x,First[digits]]/. {u:>digits[[++j]],-u:>Slot[++i]}]
	]
	]/@places
	]
];
filterIntegers[expr_]:=Block[
	{value = Activate@expr},
	If[!IntegerQ@value,Nothing];
	{value,expr}
]
filterJoin[expr_]:=Block[
	{count},
	If[Head[expr]==AngleBracket,Return@Nothing];
	count=Count[expr,_AngleBracket,Infinity];
	If[count>0,Nothing, expr]
]
findSimplest[list_List]:=Block[
	{exprs=Last@Transpose[list]},
	First@SortBy[exprs,LeafCount]
]


digits={1,1,4,5,1,4};
ops=Flatten@{Inactive/@{Plus,LeftTeeArrow,RightTeeArrow,Times,Divide},AngleBracket};
patterns =Evaluate[First[enumerate[digits]]]&@@@Tuples[ops,Length@digits-1];
patterns =DeleteDuplicates[filterJoin/@patterns];
answers =findSimplest/@SortBy[GroupBy[Quiet[filterIntegers/@patterns],First],First]
