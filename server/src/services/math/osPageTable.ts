import { TaskData } from './types';

export interface PageTableEntry {
  index: number;
  value: string; // 32-bit hex PTE, e.g. "0x1432c007"
  present: boolean;
}

export interface PageTable {
  address: string;
  level: number; // 1 = Page Directory, 2 = Page Table
  entries: PageTableEntry[];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandom32BitPageAddress(excludeSet: Set<string>): string {
  let addr = '';
  do {
    const pfn = getRandomInt(0x10000, 0xEFFFF);
    addr = `0x${pfn.toString(16).toLowerCase()}000`;
  } while (excludeSet.has(addr));
  excludeSet.add(addr);
  return addr;
}

export function generatePageTableTask() {
  const generatedAddresses = new Set<string>();

  // Generate 8 unique 32-bit page-aligned addresses (1 for L1 Page Directory, 7 for L2 Page Tables)
  const tableAddresses: string[] = [];
  for (let i = 0; i < 8; i++) {
    tableAddresses.push(getRandom32BitPageAddress(generatedAddresses));
  }

  // Active translation path:
  // Random virtual address: X (10 bits, L1 Index), Y (10 bits, L2 Index), offset (12 bits)
  const X = getRandomInt(100, 900); // L1 Index (0-1023)
  const Y = getRandomInt(100, 900); // L2 Index (0-1023)
  const offset = getRandomInt(0x100, 0xEFF); // Offset within the page (12 bits)

  const virtualAddressNumeric = (X << 22) | (Y << 12) | offset;
  const virtualAddress = `0x${virtualAddressNumeric.toString(16).padStart(8, '0').toLowerCase()}`;

  // Pick active L2 table (index 1 to 7)
  const activeL2Idx = getRandomInt(1, 7);
  const activeL2Addr = tableAddresses[activeL2Idx];

  // Pick random physical page frame address
  const physicalFrame = getRandom32BitPageAddress(generatedAddresses);

  // Path permissions:
  // RW bit (bit 1 of PTE): 1 = Read/Write, 0 = Read-Only
  const permL1 = getRandomInt(0, 1); // 0 or 1
  const permL2 = getRandomInt(0, 1); // 0 or 1

  const finalWritePermission = (permL1 === 1 && permL2 === 1) ? '1' : '0';

  const tables: PageTable[] = [];

  // Generate the 8 tables
  for (let i = 0; i < 8; i++) {
    const addr = tableAddresses[i];
    const level = i === 0 ? 1 : 2;
    const entries: PageTableEntry[] = [];
    const usedIndices = new Set<number>();

    // Add the active path entry
    if (i === 0) {
      // Root (L1) table entry at index X
      // PTE = activeL2Addr (upper 20 bits) | U/S (1) | R/W (permL1) | P (1)
      const pteValue = (parseInt(activeL2Addr, 16) & 0xFFFFF000) | (1 << 2) | (permL1 << 1) | 1;
      entries.push({
        index: X,
        value: `0x${pteValue.toString(16).padStart(8, '0').toLowerCase()}`,
        present: true
      });
      usedIndices.add(X);
    } else if (i === activeL2Idx) {
      // Active L2 table entry at index Y
      // PTE = physicalFrame (upper 20 bits) | U/S (1) | R/W (permL2) | P (1)
      const pteValue = (parseInt(physicalFrame, 16) & 0xFFFFF000) | (1 << 2) | (permL2 << 1) | 1;
      entries.push({
        index: Y,
        value: `0x${pteValue.toString(16).padStart(8, '0').toLowerCase()}`,
        present: true
      });
      usedIndices.add(Y);
    }

    // Add 5 more random entries to make exactly 6 entries in the table
    while (entries.length < 6) {
      const idx = getRandomInt(0, 1023);
      if (usedIndices.has(idx)) continue;
      usedIndices.add(idx);

      const present = Math.random() > 0.3; // 70% present
      if (present) {
        let target = '';
        if (level === 1) {
          // Points to one of the 7 L2 tables
          target = tableAddresses[getRandomInt(1, 7)];
        } else {
          // Points to random physical page
          target = `0x${getRandomInt(0x10000, 0xEFFFF).toString(16).toLowerCase()}000`;
        }

        const rw = getRandomInt(0, 1);
        const us = getRandomInt(0, 1);
        const pteValue = (parseInt(target, 16) & 0xFFFFF000) | (us << 2) | (rw << 1) | 1;
        entries.push({
          index: idx,
          value: `0x${pteValue.toString(16).padStart(8, '0').toLowerCase()}`,
          present: true
        });
      } else {
        // Not present entry
        const pteValue = getRandomInt(0x10000, 0xEFFFF) << 12; // P = 0
        entries.push({
          index: idx,
          value: `0x${pteValue.toString(16).padStart(8, '0').toLowerCase()}`,
          present: false
        });
      }
    }

    // Sort entries by index
    entries.sort((a, b) => a.index - b.index);

    tables.push({
      address: addr,
      level,
      entries
    });
  }

  // Final physical address
  const finalPhysicalAddressNumeric = (parseInt(physicalFrame, 16) & 0xFFFFF000) | offset;
  const finalPhysicalAddress = `0x${finalPhysicalAddressNumeric.toString(16).padStart(8, '0').toLowerCase()}`;

  // Explanation steps
  const steps = [
    `Gegeben ist die virtuelle Adresse **${virtualAddress}**.`,
    `Wir teilen die Adresse in Binärform auf:
     - Bits 31-22 (L1-Index / Page Directory Index)
     - Bits 21-12 (L2-Index / Page Table Index)
     - Bits 11-0 (Offset)`,
    `Für die Adresse **${virtualAddress}** erhalten wir:
     - L1-Index = **${X}**
     - L2-Index = **${Y}**
     - Offset = **0x${offset.toString(16).toLowerCase()}** (${offset} dezimal)`,
    `CR3 verweist auf die Page Directory-Tabelle bei Adresse **${tableAddresses[0]}**.`,
    `**Schritt 1 (Page Directory):** Wir suchen den Eintrag bei Index **${X}** in der Tabelle bei **${tableAddresses[0]}**.
     Der Eintrag lautet **${tables[0].entries.find(e => e.index === X)?.value}**.
     Wir dekodieren den Eintrag:
     - Die oberen 20 Bits bestimmen die Basisadresse der nächsten Stufe: **${activeL2Addr}**.
     - Das Present-Bit (Bit 0) ist 1.
     - Das R/W-Bit (Bit 1) ist ${permL1}.`,
    `**Schritt 2 (Page Table):** Wir wechseln zur Tabelle bei **${activeL2Addr}** und suchen den Eintrag bei Index **${Y}**.
     Der Eintrag lautet **${tables.find(t => t.address === activeL2Addr)?.entries.find(e => e.index === Y)?.value}**.
     Wir dekodieren den Eintrag:
     - Die oberen 20 Bits bestimmen die Basisadresse des physikalischen Frames: **${physicalFrame}**.
     - Das Present-Bit (Bit 0) ist 1.
     - Das R/W-Bit (Bit 1) ist ${permL2}.`,
    `**Schritt 3 (Zusammensetzen der physikalischen Adresse):** Wir addieren den Offset **0x${offset.toString(16).toLowerCase()}** zur Frame-Basisadresse **${physicalFrame}**:
     $$\\text{Physikalische Adresse} = ${physicalFrame} + 0x${offset.toString(16).toLowerCase()} = ${finalPhysicalAddress}$$`,
    `**Rechte-Kombination (AND-Logik):** Die Zugriffsrechte werden entlang des Pfades kombiniert:
     - L1 R/W = ${permL1}
     - L2 R/W = ${permL2}
     Gesamtschreibrecht = L1 R/W & L2 R/W = ${permL1} & ${permL2} = **${finalWritePermission}**.
     Lesezugriff ist immer **1** (da Present = 1).`,
    `Das Ergebnis ist die physikalische Adresse **${finalPhysicalAddress}** mit: Lesezugriff = **1**, Schreibzugriff = **${finalWritePermission}**.`
  ];

  const taskData: TaskData & { 
    tables: PageTable[]; 
    addressAnswer: string; 
    permissionReadAnswer: string;
    permissionWriteAnswer: string;
  } = {
    type: 'os_page_table',
    mathQuery: '',
    prompt: `Führe die Adressübersetzung für die virtuelle Adresse **${virtualAddress}** durch. Der CR3-Register (Seitentabellen-Basisregister) zeigt auf die Tabelle bei Adresse **${tableAddresses[0]}**.`,
    answer: `${finalPhysicalAddress}, 1, ${finalWritePermission}`,
    addressAnswer: finalPhysicalAddress,
    permissionReadAnswer: '1',
    permissionWriteAnswer: finalWritePermission,
    explanation: steps,
    tables
  };

  return taskData;
}
