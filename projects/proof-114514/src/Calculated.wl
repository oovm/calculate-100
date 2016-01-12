(* ::Package:: *)

SetDirectory@NotebookDirectory[];


LeftTeeArrow[x_,y_]:=Inactive[Plus][Inactive[Minus][x],y];
AngleBracket[t_Integer,u_Integer]:=If[
	u==0,
	10t+u,
	10^IntegerLength[u]t+u
];
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
	{value = Quiet@Check[Activate@expr,Infinity]},
	If[!IntegerQ@value,Return@Nothing];
	If[value<0,{-value,Inactive[Minus][expr]},{value,expr}]
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
ops={Inactive@Plus,Inactive@Subtract,LeftTeeArrow,Inactive@Times,Inactive@Divide,AngleBracket};
patterns =Evaluate[First[enumerate[digits]]]&@@@Tuples[ops,Length@digits-1];
patterns =DeleteDuplicates[filterJoin/@patterns];
answers = findSimplest/@SortBy[GroupBy[filterIntegers/@patterns,First],First]


Export["cache.raw.json",answers,"ExpressionJSON"];


digits={1,1,4!,5,1,4};
ops={Inactive@Plus,Inactive@Subtract,LeftTeeArrow,Inactive@Times,Inactive@Divide};
patterns =Evaluate[First[enumerate[digits]]]&@@@Tuples[ops,Length@digits-1];
patterns =DeleteDuplicates[filterJoin/@patterns];
answers = findSimplest/@SortBy[GroupBy[filterIntegers/@patterns,First],First];
answers/.{24->Inactive[Factorial][4]}


digits={1,1,4!,5,1,4!};
ops={Inactive@Plus,Inactive@Subtract,LeftTeeArrow,Inactive@Times,Inactive@Divide};
patterns =Evaluate[First[enumerate[digits]]]&@@@Tuples[ops,Length@digits-1];
patterns =DeleteDuplicates[filterJoin/@patterns];
answers = findSimplest/@SortBy[GroupBy[filterIntegers/@patterns,First],First];
answers/.{24->Inactive[Factorial][4]}
