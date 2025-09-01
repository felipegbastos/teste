import { test, expect } from "@playwright/test";
import * as dotenv from "dotenv";
import * as pedido from "../pedido.json";

dotenv.config();

// --- Funções Auxiliares (mantidas como antes) ---
function calcularIdade(dataNascimento: string): number {
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
}

function agruparVisitantesPorIdade(visitantes: { dataNascimento: string }[]) {
  const grupos = { crianca: 0, adulto: 0, idoso: 0 };
  visitantes.forEach((visitante) => {
    const idade = calcularIdade(visitante.dataNascimento);
    if (idade >= 4 && idade <= 12) grupos.crianca++;
    else if (idade >= 13 && idade <= 61) grupos.adulto++;
    else if (idade >= 62) grupos.idoso++;
  });
  return grupos;
}

// --- Teste Principal da Automação ---
test.describe("RPA - Emissão de Voucher para a Estátua da Liberdade", () => {
  test(`Executando emissão para o Pedido: ${pedido.idPedido}`, async ({
    page,
  }) => {
    console.log("Iniciando a automação...");

    await page.goto(
      "https://www.cityexperiences.com/new-york/city-cruises/statue/?brandTag=Statue%20City%20Cruises"
    );
    console.log("Site acessado com sucesso na URL correta.");

    await page
      .locator("#onetrust-accept-btn-handler")
      .click({ timeout: 5000 })
      .catch(() => {});
    await page
      .locator("#sc_select_tour")
      .selectOption({ label: "General Admission" });
    await page.getByRole("button", { name: "Search" }).click();

    const modal = page.getByRole("dialog", {
      name: "Choose the Departure Location",
    });
    await expect(modal).toBeVisible();
    await modal
      .getByRole("radio", { name: new RegExp(pedido.destinoSaida, "i") })
      .click();

    await modal.getByRole("button", { name: /Buy From/i }).click();
    await page.waitForURL("**/new-york-reserve/**");
    console.log("Página do calendário carregada com sucesso.");

    // PASSO 5: Selecionar a Data de Viagem
    console.log(`Iniciando seleção da data: ${pedido.dataViagem}`);
    const dataViagem = new Date(`${pedido.dataViagem}T12:00:00`);
    const anoAlvo = dataViagem.getFullYear();
    const mesAlvo = dataViagem.toLocaleString("en-US", { month: "long" });
    const diaAlvo = dataViagem.getDate().toString();

    while (true) {
      const calendarioVisivel = await page
        .locator(".MuiPickersCalendarHeader-label")
        .textContent();
      if (
        calendarioVisivel?.includes(mesAlvo) &&
        calendarioVisivel?.includes(anoAlvo.toString())
      ) {
        break;
      }
      await page.getByRole("button", { name: "Next month" }).click();
      await page.waitForTimeout(250);
    }
    await page.getByRole("button", { name: diaAlvo, exact: true }).click();
    console.log(`Dia ${diaAlvo} de ${mesAlvo} de ${anoAlvo} selecionado.`);

    // --- PAUSA APÓS SELECIONAR A DATA ---
    console.log("Automação pausada após a seleção da data, como solicitado.");
    await page.pause();
  });
});
