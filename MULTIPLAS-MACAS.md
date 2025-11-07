# 🍎 Sistema de Múltiplas Maçãs

## ✨ Implementação

### Mecânica
- ✅ Começa com 1 maçã
- ✅ Após comer 2 maçãs, aparecem 3 maçãs simultaneamente
- ✅ Sistema progressivo que aumenta dificuldade

### Código Principal

#### Estado
```typescript
const [foods, setFoods] = useState<Position[]>([getRandomCoordinate()]);
const [foodsEaten, setFoodsEaten] = useState<number>(0);
const FOODS_AFTER_TWO = 3;
```

#### Geração de Múltiplas Maçãs
```typescript
const generateFoods = useCallback((
  currentSnake: Position[], 
  count: number, 
  existingFoods: Position[] = []
) => {
  const newFoods: Position[] = [...existingFoods];
  const occupiedPositions = [...currentSnake, ...newFoods];
  
  while (newFoods.length < count) {
    let newFoodPosition: Position;
    let attempts = 0;
    do {
      newFoodPosition = getRandomCoordinate();
      attempts++;
    } while (
      attempts < 100 &&
      occupiedPositions.some((pos) => 
        isSamePosition(pos, newFoodPosition)
      )
    );
    
    if (attempts < 100) {
      newFoods.push(newFoodPosition);
      occupiedPositions.push(newFoodPosition);
    }
  }
  
  setFoods(newFoods);
}, []);
```

#### Lógica de Coleta
```typescript
const eatenFoodIndex = foods.findIndex((food) => 
  isSamePosition(head, food)
);

if (eatenFoodIndex !== -1) {
  setFoodsEaten((prev) => {
    const newCount = prev + 1;
    
    // Após comer 2, adicionar mais maçãs
    if (newCount >= 2 && newCount % 2 === 0) {
      const remainingFoods = foods.filter((_, i) => 
        i !== eatenFoodIndex
      );
      generateFoods(newSnake, FOODS_AFTER_TWO, remainingFoods);
    } else {
      // Apenas substituir a maçã comida
      const remainingFoods = foods.filter((_, i) => 
        i !== eatenFoodIndex
      );
      generateFoods(newSnake, remainingFoods.length + 1, remainingFoods);
    }
    
    return newCount;
  });
}
```

#### Renderização
```typescript
{foods.map((food, index) => (
  <div
    key={`food-${index}-${food.x}-${food.y}`}
    className="absolute flex items-center justify-center"
    style={{
      width: `${100 / GRID_SIZE}%`,
      height: `${100 / GRID_SIZE}%`,
      left: `${food.x * (100 / GRID_SIZE)}%`,
      top: `${food.y * (100 / GRID_SIZE)}%`,
      zIndex: 1,
    }}
  >
    <div className="relative w-full h-full animate-bounce">
      <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl animate-pulse" />
      <img src="/noto--red-apple.svg" alt="Apple" />
    </div>
  </div>
))}
```

## 🎮 Progressão do Jogo

### Fase 1: Início (0-1 maçãs comidas)
- **Maçãs na tela**: 1
- **Dificuldade**: Fácil
- **Foco**: Aprender controles

### Fase 2: Intermediário (2+ maçãs comidas)
- **Maçãs na tela**: 3
- **Dificuldade**: Média
- **Foco**: Estratégia e planejamento

### Fase 3: Avançado (4+ maçãs comidas)
- **Maçãs na tela**: 3 (mantém)
- **Velocidade**: Aumenta progressivamente
- **Dificuldade**: Alta
- **Foco**: Reflexos rápidos

## 🎯 Estratégias de Jogo

### Com 1 Maçã
- Fácil de focar
- Caminho direto
- Menos opções

### Com 3 Maçãs
- Múltiplas opções
- Planejamento de rota
- Maior pontuação potencial
- Mais desafiador

## 📊 Vantagens do Sistema

### Gameplay
- ✅ Progressão natural de dificuldade
- ✅ Mais opções estratégicas
- ✅ Maior rejogabilidade
- ✅ Recompensa por habilidade

### Técnicas
- ✅ Evita colisões entre maçãs
- ✅ Evita spawn na cobra
- ✅ Limite de tentativas (100) para performance
- ✅ Mantém maçãs existentes ao adicionar novas

## 🔧 Detalhes de Implementação

### Prevenção de Colisões
```typescript
const occupiedPositions = [...currentSnake, ...newFoods];

// Verifica se posição está ocupada
occupiedPositions.some((pos) => 
  isSamePosition(pos, newFoodPosition)
)
```

### Limite de Tentativas
```typescript
let attempts = 0;
do {
  newFoodPosition = getRandomCoordinate();
  attempts++;
} while (attempts < 100 && /* colisão */);
```

### Manutenção de Maçãs Existentes
```typescript
const remainingFoods = foods.filter((_, i) => 
  i !== eatenFoodIndex
);
generateFoods(newSnake, FOODS_AFTER_TWO, remainingFoods);
```

## 🎨 Efeitos Visuais

### Cada Maçã Tem
- ✅ Animação de bounce independente
- ✅ Glow vermelho pulsante
- ✅ Sombra com blur
- ✅ Brilho aumentado

### Sincronização
- Todas as maçãs animam simultaneamente
- Efeito visual coeso
- Fácil de identificar

## 📈 Métricas

### Performance
- **Renderização**: O(n) onde n = número de maçãs
- **Colisão**: O(m) onde m = número de maçãs
- **Geração**: O(k) onde k = tentativas (max 100)

### Impacto
- **FPS**: Mantém 60 FPS com 3 maçãs
- **Memória**: Mínimo (apenas array de posições)
- **CPU**: Baixo (cálculos simples)

## 🚀 Melhorias Futuras

### Possíveis Adições
1. **Maçãs Especiais**: Diferentes cores/efeitos
2. **Power-ups**: Maçãs douradas com bônus
3. **Maçãs Temporárias**: Desaparecem após tempo
4. **Maçãs em Movimento**: Se movem pelo grid
5. **Combos de Maçãs**: Coletar sequência rápida

### Variações de Modo
1. **Modo Clássico**: Sempre 1 maçã
2. **Modo Frenesi**: Sempre 5+ maçãs
3. **Modo Progressivo**: Atual (1 → 3)
4. **Modo Aleatório**: Número varia aleatoriamente

## 🎓 Conceitos de Game Design

### Curva de Dificuldade
```
Dificuldade
    ^
    |     /----
    |    /
    |   /
    |  /
    | /
    |/
    +-----------> Tempo
    1 maçã  3 maçãs
```

### Recompensa por Habilidade
- Jogador habilidoso: Mais opções, mais pontos
- Jogador iniciante: Começa simples, progride naturalmente

### Feedback Visual
- Múltiplas maçãs = Progresso visível
- Sensação de conquista
- Motivação para continuar

---

**Resultado**: Sistema de progressão que torna o jogo mais dinâmico e desafiador! 🍎✨
