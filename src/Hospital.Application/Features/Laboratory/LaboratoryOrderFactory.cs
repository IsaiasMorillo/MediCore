using Hospital.Domain.Enums;

namespace Hospital.Application.Features.Laboratory;

public interface ILaboratoryOrderFactory
{
    IReadOnlyList<string> SupportedTestTypes { get; }

    Dictionary<string, object?>? BuildResultTemplate(TestType testType);

    string Validate(TestType testType);
}

public class LaboratoryOrderFactory : ILaboratoryOrderFactory
{
    public IReadOnlyList<string> SupportedTestTypes => ["Hemograma", "Orina", "Radiografia", "Resonancia", "Tac", "Ecografia"];

    public string Validate(TestType testType)
    {
        return testType switch
        {
            TestType.Hemograma or TestType.Orina or TestType.Radiografia or TestType.Resonancia or TestType.Tac or TestType.Ecografia => string.Empty,
            _ => $"El tipo de examen '{testType}' no es válido."
        };
    }

    public Dictionary<string, object?>? BuildResultTemplate(TestType testType)
    {
        return testType switch
        {
            TestType.Hemograma => new Dictionary<string, object?>
            {
                ["hemoglobina"] = null,
                ["hematocrito"] = null,
                ["leucocitos"] = null,
                ["plaquetas"] = null
            },
            TestType.Orina => new Dictionary<string, object?>
            {
                ["ph"] = null,
                ["densidad"] = null,
                ["glucosa"] = null,
                ["proteinas"] = null
            },
            TestType.Radiografia => new Dictionary<string, object?>
            {
                ["region"] = null,
                ["hallazgos"] = null,
                ["impresion"] = null
            },
            TestType.Resonancia => new Dictionary<string, object?>
            {
                ["region"] = null,
                ["secuencias"] = null,
                ["hallazgos"] = null,
                ["impresion"] = null
            },
            TestType.Tac => new Dictionary<string, object?>
            {
                ["region"] = null,
                ["conContraste"] = null,
                ["hallazgos"] = null
            },
            TestType.Ecografia => new Dictionary<string, object?>
            {
                ["organo"] = null,
                ["hallazgos"] = null,
                ["conclusion"] = null
            },
            _ => null
        };
    }
}